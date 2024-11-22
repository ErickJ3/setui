use std::fmt::Debug;

use rusqlite::{params, Connection, Result as SqliteResult};
use serde::{de::DeserializeOwned, Serialize};

#[derive(Default)]
pub struct SqliteManager {
    pub path: String,
}

pub trait Entity: Serialize + DeserializeOwned + Debug {
    fn get_table_name() -> String;
    fn get_id(&self) -> i64;
    fn get_create_table_sql() -> String;
}

impl SqliteManager {
    pub fn new() -> Result<Self, Box<dyn std::error::Error>> {
        let manager = Self {
            path: "./data/app.db".to_string(),
        };

        if let Some(parent) = std::path::Path::new(&manager.path).parent() {
            std::fs::create_dir_all(parent)?;
        }

        Ok(manager)
    }

    pub fn connect(&self) -> SqliteResult<Connection> {
        Connection::open(&self.path)
    }

    pub fn init_table<T: Entity>(&self) -> SqliteResult<()> {
        let conn = self.connect()?;
        conn.execute(&T::get_create_table_sql(), [])?;
        Ok(())
    }

    pub fn insert<T: Entity>(&self, entity: &T) -> SqliteResult<i64> {
        let conn = self.connect()?;
        let serialized = serde_json::to_string(entity).unwrap();

        conn.execute(
            &format!("INSERT INTO {} (data) VALUES (?)", T::get_table_name()),
            params![serialized],
        )?;

        Ok(conn.last_insert_rowid())
    }

    pub fn get_by_id<T: Entity>(&self, id: i64) -> SqliteResult<Option<T>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(&format!(
            "SELECT data FROM {} WHERE id = ?",
            T::get_table_name()
        ))?;

        let mut rows = stmt.query(params![id])?;

        if let Some(row) = rows.next()? {
            let data: String = row.get(0)?;
            let entity: T = serde_json::from_str(&data).unwrap();
            Ok(Some(entity))
        } else {
            Ok(None)
        }
    }

    pub fn update<T: Entity>(&self, entity: &T) -> SqliteResult<()> {
        let conn = self.connect()?;
        let serialized = serde_json::to_string(entity).unwrap();

        conn.execute(
            &format!("UPDATE {} SET data = ? WHERE id = ?", T::get_table_name()),
            params![serialized, entity.get_id()],
        )?;

        Ok(())
    }

    pub fn delete<T: Entity>(&self, id: i64) -> SqliteResult<()> {
        let conn = self.connect()?;
        conn.execute(
            &format!("DELETE FROM {} WHERE id = ?", T::get_table_name()),
            params![id],
        )?;

        Ok(())
    }

    pub fn list<T: Entity>(&self) -> SqliteResult<Vec<T>> {
        let conn = self.connect()?;
        let mut stmt = conn.prepare(&format!("SELECT data FROM {}", T::get_table_name()))?;

        let entities = stmt
            .query_map([], |row| {
                let data: String = row.get(0)?;
                let entity: T = serde_json::from_str(&data).unwrap();
                Ok(entity)
            })?
            .filter_map(Result::ok)
            .collect();

        Ok(entities)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde::{Deserialize, Serialize};
    use serial_test::serial;
    use std::fs;

    #[derive(Debug, Serialize, Deserialize, PartialEq)]
    struct TestEntity {
        id: i64,
        name: String,
    }

    impl Entity for TestEntity {
        fn get_table_name() -> String {
            "test_entities".to_string()
        }

        fn get_id(&self) -> i64 {
            self.id
        }

        fn get_create_table_sql() -> String {
            "CREATE TABLE IF NOT EXISTS test_entities (id INTEGER PRIMARY KEY, data TEXT NOT NULL)"
                .to_string()
        }
    }

    fn setup() -> SqliteManager {
        let test_dir = "./test_db";
        let _ = fs::remove_dir_all(test_dir);
        fs::create_dir_all(test_dir).unwrap();

        let db_path = format!("{}/test.db", test_dir);

        let manager = SqliteManager { path: db_path };
        manager.init_table::<TestEntity>().unwrap();
        manager
    }

    fn cleanup() {
        let _ = fs::remove_dir_all("./test_db");
    }

    #[test]
    #[serial]
    fn crud_operations() {
        let manager = setup();

        let entity = TestEntity {
            id: 0,
            name: "Test Entity".to_string(),
        };
        let id = manager.insert(&entity).unwrap();
        assert!(id > 0);

        let retrieved = manager.get_by_id::<TestEntity>(id).unwrap().unwrap();
        assert_eq!(retrieved.name, "Test Entity");

        let updated_entity = TestEntity {
            id,
            name: "Updated Entity".to_string(),
        };
        manager.update(&updated_entity).unwrap();
        let retrieved = manager.get_by_id::<TestEntity>(id).unwrap().unwrap();
        assert_eq!(retrieved.name, "Updated Entity");

        let entities = manager.list::<TestEntity>().unwrap();
        assert_eq!(entities.len(), 1);
        assert_eq!(entities[0].name, "Updated Entity");

        manager.delete::<TestEntity>(id).unwrap();
        assert!(manager.get_by_id::<TestEntity>(id).unwrap().is_none());

        cleanup();
    }

    #[test]
    #[serial]
    fn get_nonexistent() {
        let manager = setup();
        assert!(manager.get_by_id::<TestEntity>(999).unwrap().is_none());
        cleanup();
    }

    #[test]
    #[serial]
    fn multiple_entities() {
        let manager = setup();

        let entities = vec![
            TestEntity {
                id: 0,
                name: "First".to_string(),
            },
            TestEntity {
                id: 0,
                name: "Second".to_string(),
            },
        ];

        for entity in entities {
            manager.insert(&entity).unwrap();
        }

        let list = manager.list::<TestEntity>().unwrap();
        assert_eq!(list.len(), 2);
        cleanup();
    }

    #[test]
    #[serial]
    fn init_table() {
        let manager = setup();
        assert!(manager.init_table::<TestEntity>().is_ok());
        cleanup();
    }
}
