import { AbstractMigration, ClientPostgreSQL, Info } from "nessie";

export default class extends AbstractMigration<ClientPostgreSQL> {
  /** Runs on migrate */
  async up(_info: Info): Promise<void> {
    await this.client.queryArray(`
        CREATE EXTENSION IF NOT EXISTS "pgcrypto";
        CREATE EXTENSION IF NOT EXISTS "unaccent";

        -- hàm wrapper IMMUTABLE cho unaccent
        CREATE OR REPLACE FUNCTION immutable_unaccent(text)
        RETURNS text AS $$
        SELECT public.unaccent('public.unaccent', $1);
        $$ LANGUAGE sql IMMUTABLE;

        -- Users Table
        CREATE TABLE users (
            user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) NOT NULL UNIQUE,
            password_hash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Folders Table
        CREATE TABLE folders (
            folder_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            folder_name VARCHAR(255) NOT NULL,
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            parent_folder_id UUID REFERENCES folders(folder_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Folder Search Index
        ALTER TABLE folders
        ADD COLUMN search_tsv tsvector
        GENERATED ALWAYS AS (to_tsvector('simple', folder_name)) STORED;
            
        CREATE INDEX idx_folders_search_tsv ON folders USING GIN (search_tsv);
        CREATE INDEX idx_folders_user_id ON folders(user_id);

        -- Tags Table
        CREATE TABLE tags (
            tag_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            tag_name VARCHAR(255) NOT NULL
        );

        CREATE UNIQUE INDEX unique_tag_name_lower ON tags (LOWER(tag_name));

        -- Notes Table
        CREATE TABLE notes (
            note_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            content TEXT,
            folder_id UUID REFERENCES folders(folder_id) ON DELETE CASCADE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        ALTER TABLE notes
        ADD COLUMN search_vector tsvector
        GENERATED ALWAYS AS (
          setweight(to_tsvector('english', coalesce(immutable_unaccent(title), '')), 'A') ||
          setweight(to_tsvector('english', coalesce(immutable_unaccent(content), '')), 'B')
        ) STORED;

        CREATE INDEX idx_notes_search_vector ON notes USING GIN (search_vector);
        CREATE INDEX idx_notes_folder_id ON notes(folder_id);
        
        -- Note_Tags Junction Table
        CREATE TABLE note_tags (
            note_id UUID REFERENCES notes(note_id) ON DELETE CASCADE,
            tag_id UUID REFERENCES tags(tag_id) ON DELETE CASCADE,
            PRIMARY KEY (note_id, tag_id)
        );

        -- Background Jobs Table
        CREATE TABLE background_jobs (
            job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
            type VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'PENDING',
            result_url TEXT,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Index cho Worker query job nhanh hơn
        CREATE INDEX idx_background_jobs_status_created ON background_jobs(status, created_at);

        -- Triggers for updated_at
        CREATE OR REPLACE FUNCTION set_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = CURRENT_TIMESTAMP;
            RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        CREATE TRIGGER trigger_update_folders_updated_at
        BEFORE UPDATE ON folders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

        CREATE TRIGGER trigger_update_notes_updated_at
        BEFORE UPDATE ON notes FOR EACH ROW EXECUTE FUNCTION set_updated_at();

        CREATE TRIGGER trigger_update_jobs_updated_at
        BEFORE UPDATE ON background_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();
    `);
  }

  /** Runs on rollback */
  async down(info: Info): Promise<void> {
    // Drop Triggers
    await this.client.queryArray(
      "DROP TRIGGER IF EXISTS trigger_update_jobs_updated_at ON background_jobs;",
    );
    await this.client.queryArray(
      "DROP TRIGGER IF EXISTS trigger_update_notes_updated_at ON notes;",
    );
    await this.client.queryArray(
      "DROP TRIGGER IF EXISTS trigger_update_folders_updated_at ON folders;",
    );

    // Drop Function
    await this.client.queryArray("DROP FUNCTION IF EXISTS set_updated_at;");

    // Drop Tables (Thứ tự quan trọng: Con trước Cha sau)
    await this.client.queryArray("DROP TABLE IF EXISTS background_jobs;");
    await this.client.queryArray("DROP TABLE IF EXISTS note_tags;");
    await this.client.queryArray("DROP TABLE IF EXISTS notes;");
    await this.client.queryArray("DROP TABLE IF EXISTS tags;");
    await this.client.queryArray("DROP TABLE IF EXISTS folders;");
    await this.client.queryArray("DROP TABLE IF EXISTS users;");
  }
}
