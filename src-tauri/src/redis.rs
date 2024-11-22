use redis::{Client, Commands, Connection as RedisConnection, RedisError, RedisResult};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

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
        conn.keys(pattern)
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
