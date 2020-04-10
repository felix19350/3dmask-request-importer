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
* --src, -s: (**REQUIRED**) path to the source file, e.g.: `--src /tmp/my_file.csv`;
* --outputDir, -o: folder where the outputs will be writen, e.g.: `--outputDir /home/user`, defaults to: */tmp*;


## Input file structure:

**Note that the columns will be indexed by name.**

|Header|Data type|
|------|---------|
|`Timestamp`|Date format: M/DD/YYY H:MM:SS|
|`Unidade de saúde`|String|
|`Serviço`|String|
|`Nome da Unidade de Saúde (Normalizado)`|String|
|`Distrito / Região`|String|
|`Concelho`|String|
|`Morada`|String|
|`Código Postal`|String|
|`Zona (Manual)`|String|
|`Estado (Manual)`|String|
|`Coordenador Responsável pela Entrega Agendada`|String|
|`Prioridade (Manual)`|String|
|`Quantidade`|Number|
|`Entregas (Manual)`|String|
|`Nome `|String|
|`Email`|String|
|`Telemóvel`|String|
|`Pessoa de contacto no grupo 3D Mask Portugal (nome/telemóvel)`|String|
|`Observações`|String|
|`Tem uma necessidade real identificada de viseiras?`|String|
|`Está num serviço exposto a infectados COVID-19?`|String|
|`Sabe como colocar e retirar máscara e/ou viseira e entende o nivel de proteção que cada uma providencia?`|String|
|`Nome do Responsável de Serviço`|String|
|`Contacto do Responsável de Serviço`|String|
|`Email Address`|String|

