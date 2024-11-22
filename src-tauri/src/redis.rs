use redis::{Client, Commands, Connection as RedisConnection, RedisError, RedisResult};
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, HashSet};

#[derive(Debug, Default)]
pub struct RedisManager {
    connections: HashMap<i64, Client>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RedisKeyValue {
    pub key: String,
    pub value: String,
    pub ttl: i64,
    pub data_type: String,
}

impl RedisManager {
    pub fn new() -> Self {
        RedisManager {
            connections: HashMap::new(),
        }
    }

    pub fn connect(&mut self, id: i64, uri: &str) -> RedisResult<()> {
        let client = Client::open(uri)?;
        let _: RedisConnection = client.get_connection()?;
        self.connections.insert(id, client);
        Ok(())
    }

    pub fn disconnect(&mut self, id: i64) {
        self.connections.remove(&id);
    }

    pub fn get_client(&self, id: i64) -> Option<&Client> {
        self.connections.get(&id)
    }

    pub fn get_keys(&self, id: i64, pattern: &str) -> RedisResult<Vec<String>> {
        let client = self.get_client(id).ok_or(RedisError::from((
            redis::ErrorKind::ResponseError,
            "Connection not found",
        )))?;
        let mut conn = client.get_connection()?;

        let mut cursor = 0;
        let mut keys = HashSet::new();

        loop {
            let (next_cursor, mut batch): (i64, Vec<String>) = redis::cmd("SCAN")
                .arg(cursor)
                .arg("MATCH")
                .arg(pattern)
                .arg("COUNT")
                .arg(100)
                .query(&mut conn)?;

            keys.extend(batch.drain(..));
            cursor = next_cursor;

            if cursor == 0 {
                break;
            }
        }

        Ok(keys.into_iter().collect())
    }

    pub fn get_key_info(&self, id: i64, key: &str) -> RedisResult<Option<RedisKeyValue>> {
        let client = self.get_client(id).ok_or(RedisError::from((
            redis::ErrorKind::ResponseError,
            "Connection not found",
        )))?;
        let mut conn = client.get_connection()?;

        let exists: bool = conn.exists(key)?;
        if !exists {
            return Ok(None);
        }

        let key_type: String = conn.key_type(key)?;

        let ttl: i64 = conn.ttl(key)?;

        let value = match key_type.as_str() {
            "string" => conn.get(key)?,
            "list" => {
                let values: Vec<String> = conn.lrange(key, 0, -1)?;
                serde_json::to_string(&values).unwrap_or_default()
            }
            "set" => {
                let values: Vec<String> = conn.smembers(key)?;
                serde_json::to_string(&values).unwrap_or_default()
            }
            "hash" => {
                let values: HashMap<String, String> = conn.hgetall(key)?;
                serde_json::to_string(&values).unwrap_or_default()
            }
            "zset" => {
                let values: Vec<(String, f64)> = conn.zrange_withscores(key, 0, -1)?;
                serde_json::to_string(&values).unwrap_or_default()
            }
            _ => String::from("Unsupported type"),
        };

        Ok(Some(RedisKeyValue {
            key: key.to_string(),
            value,
            ttl,
            data_type: key_type,
        }))
    }

    pub fn set_key(&self, id: i64, key: &str, value: &str) -> RedisResult<()> {
        let client = self.get_client(id).ok_or(RedisError::from((
            redis::ErrorKind::ResponseError,
            "Connection not found",
        )))?;
        let mut conn = client.get_connection()?;
        conn.set(key, value)
    }

    pub fn delete_key(&self, id: i64, key: &str) -> RedisResult<()> {
        let client = self.get_client(id).ok_or(RedisError::from((
            redis::ErrorKind::ResponseError,
            "Connection not found",
        )))?;
        let mut conn = client.get_connection()?;
        conn.del(key)
    }

    pub fn set_ttl(&self, id: i64, key: &str, ttl: i64) -> RedisResult<()> {
        let client = self.get_client(id).ok_or(RedisError::from((
            redis::ErrorKind::ResponseError,
            "Connection not found",
        )))?;

        let mut conn = client.get_connection()?;

        if ttl < 0 {
            let _: () = conn.persist(key)?;
        } else {
            let _: bool = conn.expire(key, ttl)?;
        }

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serial_test::serial;

    const TEST_REDIS_URI: &str = "redis://127.0.0.1:6379/";
    const TEST_ID: i64 = 1;

    fn setup() -> RedisManager {
        let mut manager = RedisManager::new();
        manager.connect(TEST_ID, TEST_REDIS_URI).unwrap();
        manager
    }

    fn cleanup(manager: &RedisManager) {
        if let Some(client) = manager.get_client(TEST_ID) {
            let mut conn = client.get_connection().unwrap();
            let _: () = redis::cmd("FLUSHDB").query(&mut conn).unwrap();
        }
    }

    #[test]
    #[serial]
    fn connection() {
        let mut manager = RedisManager::new();
        assert!(manager.connect(TEST_ID, TEST_REDIS_URI).is_ok());
        assert!(manager.get_client(TEST_ID).is_some());

        manager.disconnect(TEST_ID);
        assert!(manager.get_client(TEST_ID).is_none());
    }

    #[test]
    #[serial]
    fn set_get_string() {
        let manager = setup();

        assert!(manager.set_key(TEST_ID, "test_key", "test_value").is_ok());

        let info = manager.get_key_info(TEST_ID, "test_key").unwrap().unwrap();
        assert_eq!(info.key, "test_key");
        assert_eq!(info.value, "test_value");
        assert_eq!(info.data_type, "string");

        cleanup(&manager);
    }

    #[test]
    #[serial]
    fn ttl() {
        let manager = setup();

        manager.set_key(TEST_ID, "ttl_key", "value").unwrap();
        manager.set_ttl(TEST_ID, "ttl_key", 100).unwrap();

        let info = manager.get_key_info(TEST_ID, "ttl_key").unwrap().unwrap();
        assert!(info.ttl > 0 && info.ttl <= 100);

        manager.set_ttl(TEST_ID, "ttl_key", -1).unwrap();
        let info = manager.get_key_info(TEST_ID, "ttl_key").unwrap().unwrap();
        assert_eq!(info.ttl, -1);

        cleanup(&manager);
    }

    #[test]
    #[serial]
    fn delete_key() {
        let manager = setup();

        manager.set_key(TEST_ID, "delete_key", "value").unwrap();
        assert!(manager
            .get_key_info(TEST_ID, "delete_key")
            .unwrap()
            .is_some());

        manager.delete_key(TEST_ID, "delete_key").unwrap();
        assert!(manager
            .get_key_info(TEST_ID, "delete_key")
            .unwrap()
            .is_none());

        cleanup(&manager);
    }

    #[test]
    #[serial]
    fn get_keys() {
        let manager = setup();

        manager.set_key(TEST_ID, "key1", "value1").unwrap();
        manager.set_key(TEST_ID, "key2", "value2").unwrap();

        let keys = manager.get_keys(TEST_ID, "key*").unwrap();
        assert_eq!(keys.len(), 2);
        assert!(keys.contains(&"key1".to_string()));
        assert!(keys.contains(&"key2".to_string()));

        cleanup(&manager);
    }

    #[test]
    #[serial]
    fn complex_types() {
        let manager = setup();
        let mut conn = manager
            .get_client(TEST_ID)
            .unwrap()
            .get_connection()
            .unwrap();

        let _: () = conn.lpush("list_key", &["value1", "value2"]).unwrap();
        let info = manager.get_key_info(TEST_ID, "list_key").unwrap().unwrap();
        assert_eq!(info.data_type, "list");
        assert!(info.value.contains("value1"));
        assert!(info.value.contains("value2"));

        let _: () = conn.sadd("set_key", &["value1", "value2"]).unwrap();
        let info = manager.get_key_info(TEST_ID, "set_key").unwrap().unwrap();
        assert_eq!(info.data_type, "set");
        assert!(info.value.contains("value1"));
        assert!(info.value.contains("value2"));

        let _: () = conn.hset("hash_key", "field1", "value1").unwrap();
        let info = manager.get_key_info(TEST_ID, "hash_key").unwrap().unwrap();
        assert_eq!(info.data_type, "hash");
        assert!(info.value.contains("field1"));
        assert!(info.value.contains("value1"));

        cleanup(&manager);
    }
}
