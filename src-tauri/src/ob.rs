use serde::{Deserialize, Serialize};

use crate::sqlite::Entity;

#[derive(Debug, Serialize, Deserialize)]
struct Connections {
    id: i64,
    uri_connection: String,
    name: String,
    color: String,
}

impl Entity for Connections {
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
