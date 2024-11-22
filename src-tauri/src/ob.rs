use serde::{Deserialize, Serialize};

use crate::sqlite::Entity;

#[derive(Debug, Serialize, Deserialize)]
pub struct Connection {
    pub id: i64,
    pub uri_connection: String,
    pub name: String,
    pub color: String,
}

impl Entity for Connection {
    fn get_table_name() -> String {
        String::from("connections")
    }

    fn get_id(&self) -> i64 {
        self.id
    }

    fn get_create_table_sql() -> String {
        String::from(
            "CREATE TABLE IF NOT EXISTS connections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                data TEXT NOT NULL
            )",
        )
    }
}
