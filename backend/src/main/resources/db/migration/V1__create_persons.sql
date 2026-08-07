CREATE TABLE persons (
  id BIGSERIAL PRIMARY KEY,
  first_name VARCHAR(120) NOT NULL,
  last_name VARCHAR(120) NOT NULL,
  birth_date DATE,
  death_date DATE,
  birth_place VARCHAR(255),
  photo_url VARCHAR(500),
  notes VARCHAR(2000),
  father_id BIGINT REFERENCES persons(id),
  mother_id BIGINT REFERENCES persons(id)
);

INSERT INTO persons (first_name,last_name,birth_date,death_date,birth_place,notes) VALUES
('Émile','Dubois','1928-04-12','2004-09-03','Namur','Menuisier, amoureux des jardins.'),
('Jeanne','Lambert','1931-11-08','2012-02-17','Dinant','A transmis les albums et les histoires familiales.'),
('André','Martin','1925-07-23','1998-12-11','Liège','Cheminot pendant trente-huit ans.'),
('Madeleine','Simon','1930-01-16','2015-06-28','Huy','Passionnée de photographie.');
INSERT INTO persons (first_name,last_name,birth_date,birth_place,father_id,mother_id) VALUES
('Philippe','Dubois','1955-05-20','Namur',1,2),
('Claire','Martin','1958-10-04','Liège',3,4);
INSERT INTO persons (first_name,last_name,birth_date,birth_place,father_id,mother_id,notes) VALUES
('Sophie','Dubois','1984-03-14','Bruxelles',5,6,'Architecte et gardienne actuelle des archives familiales.'),
('Julien','Dubois','1987-08-29','Bruxelles',5,6,'Musicien et grand voyageur.');
