import {
  AbstractMigration,
  ClientPostgreSQL,
  Info,
} from "https://deno.land/x/nessie@2.0.11/mod.ts";

export default class extends AbstractMigration<ClientPostgreSQL> {
  /** Runs on migrate */
  async up(info: Info): Promise<void> {
    await this.client.queryArray(`
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";

        CREATE TABLE users (
            user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE folders (
            folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            folder_name VARCHAR(255) NOT NULL,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            parent_folder_id UUID REFERENCES folders(folder_id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        
        CREATE INDEX idx_folders_user_id ON folders(user_id);
        
        CREATE TABLE tags (
            tag_name VARCHAR(255) PRIMARY KEY
        );

        CREATE TABLE notes (
            note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            content TEXT,
            -- khong dung ref user_id cuz
            -- Open Note yeu cau note phai thuoc mot folder 
            -- user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            folder_id UUID REFERENCES folders(folder_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_notes_folder_id ON notes(folder_id);

        CREATE TABLE note_tags (
            note_id UUID REFERENCES notes(note_id) ON DELETE CASCADE,
            tag_name VARCHAR(255) REFERENCES tags(tag_name) ON DELETE CASCADE,
            PRIMARY KEY (note_id, tag_name)
        );

        CREATE TABLE attachments (
            attachment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            note_id UUID REFERENCES notes(note_id) ON DELETE CASCADE,
            path TEXT NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            size INT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX idx_attachments_note_id ON attachments(note_id);

        -- trigger function for update_at
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- trigger for auto update updated_at
        CREATE TRIGGER trigger_update_folders_updated_at
        BEFORE UPDATE ON folders
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

        CREATE TRIGGER trigger_update_notes_updated_at
        BEFORE UPDATE ON notes
        FOR EACH ROW
        EXECUTE FUNCTION set_updated_at();

    `);
  }

  /** Runs on rollback */
  async down(info: Info): Promise<void> {
    await this.client.queryArray(
      "DROP TRIGGER IF EXISTS trigger_update_notes_updated_at ON notes;",
    );
    await this.client.queryArray(
      "DROP TRIGGER IF EXISTS trigger_update_folders_updated_at ON folders;",
    );
    await this.client.queryArray("DROP FUNCTION IF EXISTS set_updated_at;");
    await this.client.queryArray("DROP TABLE IF EXISTS attachments;");
    await this.client.queryArray("DROP TABLE IF EXISTS note_tags;");
    await this.client.queryArray("DROP TABLE IF EXISTS notes;");
    await this.client.queryArray("DROP TABLE IF EXISTS tags;");
    await this.client.queryArray("DROP TABLE IF EXISTS folders;");
    await this.client.queryArray("DROP TABLE IF EXISTS users;");
  }
}
