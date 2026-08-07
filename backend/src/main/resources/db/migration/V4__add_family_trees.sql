CREATE TABLE family_trees (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(160) NOT NULL,
  description VARCHAR(500),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO family_trees (name, description) VALUES ('Famille MBA DIO TIMO', 'Arbre importé depuis GENEALOGIE_SIMPLIFIE.doc');
ALTER TABLE persons ADD COLUMN tree_id BIGINT REFERENCES family_trees(id);
UPDATE persons SET tree_id = 1;
ALTER TABLE persons ALTER COLUMN tree_id SET NOT NULL;
CREATE INDEX persons_tree_id_idx ON persons(tree_id);
