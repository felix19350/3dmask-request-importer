# 3dmask-request-importer
A simple utility that takes a csv with the requests that have been submitted to 3dmaskpt and creates a corresponding sql file to easily start migrating the data to the new backoffice

## Outputs:
Running this utility produces two outputs:
* A SQL file with the an insert statement for each row that was successfully processed;
* A plain text file with the details of any error that was encountered; 

## Requirements:
* Node 12
* A CSV file with the first row as a header, that is according to the provided file structure.

## Usage:

### Minimal usage:
* node src/main.js --src <source_csv_file>

### Options:
Program options are provided via *--<option_name>*, they are optional except when stated otherwise:
* --src, -s: (**REQUIRED**) path to the source file, e.g.: *--src /tmp/my_file.csv*;
* --outputDir, -o: folder where the outputs will be writen, e.g.: *--outputDir /home/user*, defaults to: */tmp*;


## Input file structure:

**Note that the columns will be indexed by name.**

|Timestamp|Unidade de saúde|Serviço|Nome da Unidade de Saúde (Normalizado)|Distrito / Região|Concelho|Morada|Código Postal|Zona (Manual)|Estado (Manual)|"Coordenador Responsável pela Entrega Agendada"|Prioridade (Manual)|Quantidade|Entregas (Manual)|Nome |Email|Telemóvel|Pessoa de contacto no grupo 3D Mask Portugal (nome/telemóvel)|Observações|Tem uma necessidade real identificada de viseiras?|Está num serviço exposto a infectados COVID-19?|Sabe como colocar e retirar máscara e/ou viseira e entende o nivel de proteção que cada uma providencia?|Nome do Responsável de Serviço|Contacto do Responsável de Serviço|Email Address|
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
