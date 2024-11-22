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
