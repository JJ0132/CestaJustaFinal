

CREATE DATABASE IF NOT EXISTS CestaJustaDB;
USE CestaJustaDB;

CREATE TABLE IF NOT EXISTS Usuarios (
	Nombre VARCHAR(100) NULL,
	Apellido1 VARCHAR(100) NULL,
	Apellido2 VARCHAR(100) NULL,
	Nombre_Usuario VARCHAR(50) NOT NULL,
	Mail VARCHAR(190) NULL,
	Telefono VARCHAR(20) NULL,
	Fecha_Creacion DATETIME NULL,
	Premium BOOLEAN NULL,
	PRIMARY KEY (Nombre_Usuario)
);

CREATE TABLE IF NOT EXISTS Tracking (
	Nombre_Usuario VARCHAR(50) NOT NULL,
	Precio_Semanal DECIMAL(10,2) NULL,
	Gastos_Mes DECIMAL(10,2) NULL,
	Gasto_Total DECIMAL(10,2) NULL,
	PRIMARY KEY (Nombre_Usuario),
	CONSTRAINT fk_tracking_usuarios
		FOREIGN KEY (Nombre_Usuario) REFERENCES Usuarios(Nombre_Usuario)
		ON UPDATE CASCADE
		ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS Recetas_Desayuno (
	ID_Desayuno INT NOT NULL AUTO_INCREMENT,
	Nombre_Desayuno VARCHAR(150) NULL,
	Precio_Desayuno DECIMAL(10,2) NULL,
	PRIMARY KEY (ID_Desayuno)
);

-- Relación muchos-a-muchos: una receta de desayuno puede necesitar varios ingredientes
CREATE TABLE IF NOT EXISTS Recetas_Desayuno_Ingredientes (
	ID_Desayuno INT NOT NULL,
	Nombre_Ingrediente VARCHAR(150) NOT NULL,
	Cantidad DECIMAL(10,2) NULL,
	Unidad VARCHAR(30) NULL,
	PRIMARY KEY (ID_Desayuno, Nombre_Ingrediente),
	CONSTRAINT fk_rdi_desayuno
		FOREIGN KEY (ID_Desayuno) REFERENCES Recetas_Desayuno(ID_Desayuno)
		ON UPDATE CASCADE
		ON DELETE CASCADE,
	CONSTRAINT fk_rdi_ingrediente
		FOREIGN KEY (Nombre_Ingrediente) REFERENCES Ingredientes(Nombre_Ingrediente)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Recetas_Comida (
	ID_Comida INT NOT NULL AUTO_INCREMENT,
	Nombre_Comida VARCHAR(150) NULL,
	Precio_Comida DECIMAL(10,2) NULL,
	PRIMARY KEY (ID_Comida)
);

-- Relación muchos-a-muchos: una receta de comida puede necesitar varios ingredientes
CREATE TABLE IF NOT EXISTS Recetas_Comida_Ingredientes (
	ID_Comida INT NOT NULL,
	Nombre_Ingrediente VARCHAR(150) NOT NULL,
	Cantidad DECIMAL(10,2) NULL,
	Unidad VARCHAR(30) NULL,
	PRIMARY KEY (ID_Comida, Nombre_Ingrediente),
	CONSTRAINT fk_rci_comida
		FOREIGN KEY (ID_Comida) REFERENCES Recetas_Comida(ID_Comida)
		ON UPDATE CASCADE
		ON DELETE CASCADE,
	CONSTRAINT fk_rci_ingrediente
		FOREIGN KEY (Nombre_Ingrediente) REFERENCES Ingredientes(Nombre_Ingrediente)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Recetas_Cena (
	ID_Cena INT NOT NULL AUTO_INCREMENT,
	Nombre_Cena VARCHAR(150) NULL,
	Precio_Cena DECIMAL(10,2) NULL,
	PRIMARY KEY (ID_Cena)
);

-- Relación muchos-a-muchos: una receta de cena puede necesitar varios ingredientes
CREATE TABLE IF NOT EXISTS Recetas_Cena_Ingredientes (
	ID_Cena INT NOT NULL,
	Nombre_Ingrediente VARCHAR(150) NOT NULL,
	Cantidad DECIMAL(10,2) NULL,
	Unidad VARCHAR(30) NULL,
	PRIMARY KEY (ID_Cena, Nombre_Ingrediente),
	CONSTRAINT fk_rcei_cena
		FOREIGN KEY (ID_Cena) REFERENCES Recetas_Cena(ID_Cena)
		ON UPDATE CASCADE
		ON DELETE CASCADE,
	CONSTRAINT fk_rcei_ingrediente
		FOREIGN KEY (Nombre_Ingrediente) REFERENCES Ingredientes(Nombre_Ingrediente)
		ON UPDATE CASCADE
		ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS Ingredientes (
	ID INT NOT NULL AUTO_INCREMENT,
	Nombre_Ingrediente VARCHAR(150) NULL,
	Precio DECIMAL(10,2) NULL,
	Fecha_Captura_Precio DATETIME NULL,
	PRIMARY KEY (ID),
	UNIQUE KEY uq_ingredientes_nombre (Nombre_Ingrediente)
);

CREATE TABLE IF NOT EXISTS Menu_Diario (
	ID_Menu_Diario INT NOT NULL AUTO_INCREMENT,
	ID_Desayuno INT NULL,
	ID_Comida INT NULL,
	ID_Cena INT NULL,
	Precio_Total_Dia DECIMAL(10,2) NULL,
	PRIMARY KEY (ID_Menu_Diario),
	CONSTRAINT fk_menu_diario_desayuno
		FOREIGN KEY (ID_Desayuno) REFERENCES Recetas_Desayuno(ID_Desayuno)
		ON UPDATE CASCADE
		ON DELETE SET NULL,
	CONSTRAINT fk_menu_diario_comida
		FOREIGN KEY (ID_Comida) REFERENCES Recetas_Comida(ID_Comida)
		ON UPDATE CASCADE
		ON DELETE SET NULL,
	CONSTRAINT fk_menu_diario_cena
		FOREIGN KEY (ID_Cena) REFERENCES Recetas_Cena(ID_Cena)
		ON UPDATE CASCADE
		ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS Menu_Semanal (
	ID_Menu_Semanal INT NOT NULL AUTO_INCREMENT,
	Fecha_Inicio DATE NULL,
	Precio_Semana DECIMAL(10,2) NOT NULL,
	ID_Menu_Lunes INT NOT NULL,
	ID_Menu_Martes INT NOT NULL,
	ID_Menu_Miercoles INT NOT NULL,
	ID_Menu_Jueves INT NOT NULL,
	ID_Menu_Viernes INT NOT NULL,
	ID_Menu_Sabado INT NOT NULL,
	ID_Menu_Domingo INT NOT NULL,
	PRIMARY KEY (ID_Menu_Semanal),
	CONSTRAINT fk_menu_semanal_lunes
		FOREIGN KEY (ID_Menu_Lunes) REFERENCES Menu_Diario(ID_Menu_Diario)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_menu_semanal_martes
		FOREIGN KEY (ID_Menu_Martes) REFERENCES Menu_Diario(ID_Menu_Diario)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_menu_semanal_miercoles
		FOREIGN KEY (ID_Menu_Miercoles) REFERENCES Menu_Diario(ID_Menu_Diario)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_menu_semanal_jueves
		FOREIGN KEY (ID_Menu_Jueves) REFERENCES Menu_Diario(ID_Menu_Diario)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_menu_semanal_viernes
		FOREIGN KEY (ID_Menu_Viernes) REFERENCES Menu_Diario(ID_Menu_Diario)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_menu_semanal_sabado
		FOREIGN KEY (ID_Menu_Sabado) REFERENCES Menu_Diario(ID_Menu_Diario)
		ON UPDATE CASCADE ON DELETE RESTRICT,
	CONSTRAINT fk_menu_semanal_domingo
		FOREIGN KEY (ID_Menu_Domingo) REFERENCES Menu_Diario(ID_Menu_Diario)
		ON UPDATE CASCADE ON DELETE RESTRICT
);

-- Evita que dos semanas consecutivas tengan exactamente el mismo set de menús diarios.
-- Nota: esto es una regla de negocio; en MySQL se implementa con trigger.
DROP TRIGGER IF EXISTS trg_menu_semanal_no_repetir_consecutivo_insert;
DELIMITER $$
CREATE TRIGGER trg_menu_semanal_no_repetir_consecutivo_insert
BEFORE INSERT ON Menu_Semanal
FOR EACH ROW
BEGIN
	DECLARE prev_id INT;
	SET prev_id = (
		SELECT ID_Menu_Semanal
		FROM Menu_Semanal
		ORDER BY ID_Menu_Semanal DESC
		LIMIT 1
	);

	IF prev_id IS NOT NULL THEN
		IF EXISTS (
			SELECT 1
			FROM Menu_Semanal ms
			WHERE ms.ID_Menu_Semanal = prev_id
			  AND ms.ID_Menu_Lunes = NEW.ID_Menu_Lunes
			  AND ms.ID_Menu_Martes = NEW.ID_Menu_Martes
			  AND ms.ID_Menu_Miercoles = NEW.ID_Menu_Miercoles
			  AND ms.ID_Menu_Jueves = NEW.ID_Menu_Jueves
			  AND ms.ID_Menu_Viernes = NEW.ID_Menu_Viernes
			  AND ms.ID_Menu_Sabado = NEW.ID_Menu_Sabado
			  AND ms.ID_Menu_Domingo = NEW.ID_Menu_Domingo
		) THEN
			SIGNAL SQLSTATE '45000'
				SET MESSAGE_TEXT = 'No se permite repetir exactamente el mismo Menu_Semanal en semanas consecutivas.';
		END IF;
	END IF;
END$$
DELIMITER ;

DROP TRIGGER IF EXISTS trg_menu_semanal_no_repetir_consecutivo_update;
DELIMITER $$
CREATE TRIGGER trg_menu_semanal_no_repetir_consecutivo_update
BEFORE UPDATE ON Menu_Semanal
FOR EACH ROW
BEGIN
	DECLARE prev_id INT;
	SET prev_id = (
		SELECT ID_Menu_Semanal
		FROM Menu_Semanal
		WHERE ID_Menu_Semanal < NEW.ID_Menu_Semanal
		ORDER BY ID_Menu_Semanal DESC
		LIMIT 1
	);

	IF prev_id IS NOT NULL THEN
		IF EXISTS (
			SELECT 1
			FROM Menu_Semanal ms
			WHERE ms.ID_Menu_Semanal = prev_id
			  AND ms.ID_Menu_Lunes = NEW.ID_Menu_Lunes
			  AND ms.ID_Menu_Martes = NEW.ID_Menu_Martes
			  AND ms.ID_Menu_Miercoles = NEW.ID_Menu_Miercoles
			  AND ms.ID_Menu_Jueves = NEW.ID_Menu_Jueves
			  AND ms.ID_Menu_Viernes = NEW.ID_Menu_Viernes
			  AND ms.ID_Menu_Sabado = NEW.ID_Menu_Sabado
			  AND ms.ID_Menu_Domingo = NEW.ID_Menu_Domingo
		) THEN
			SIGNAL SQLSTATE '45000'
				SET MESSAGE_TEXT = 'No se permite repetir exactamente el mismo Menu_Semanal en semanas consecutivas.';
		END IF;
	END IF;
END$$
DELIMITER ;

