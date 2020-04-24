const fs = require("fs");
const path = require("path");
const uuid = require("uuid");
const csv = require("csv-parser");
const moment = require("moment");
const zones = require("../data/zones.json");
const districts = require("../data/districts.json");
const municipalities = require("../data/municipalities.json");

class CsvDataTransformer {

    constructor(baseDir) {
        this.baseDir = baseDir;
        this.zones = zones.map(it => ({ zone: this.normalizeZoneName(it.zone), id: it.id }));
        this.districts = districts.map(it => ({ district: this.normalizeDistrictName(it.district), id: it.id }));
        this.municipalities = municipalities.map(it => ({ municipality: this.normalizeMunicipalityName(it.municipality), id: it.id }));
    }

    processCsvFile(inputFilePath) {
        const sqlOutputPath = path.join(this.baseDir, `${new Date().toISOString()}_output.sql`);
        const reportFilePath = path.join(this.baseDir, `${new Date().toISOString()}_report.txt`);

        const statements = [`--- Output file generated from ${inputFilePath}---`];
        const errors = [];
        const readStream = fs.createReadStream(inputFilePath);
        let n = 0;

        return new Promise((resolve, reject) => {
            readStream.pipe(csv())
                .on("data", (row) => {
                    try {
                        n++;
                        const transformedRow = this.transformRow(row);
                        const rowN = `------ ROW: ${n}`;
                        statements.push(rowN);
                        const requestTimestamp = `------ ${transformedRow.timestamp}`;
                        statements.push(requestTimestamp);
                        statements.push(this.mapRowToSqlStatement(transformedRow.request, 'request'));
                        this.mapRowToSqlStatements(transformedRow.items, 'request_item').forEach(l => statements.push(l));
                    } catch (err) {
                        errors.push(`ROW: ${n} | Error: ${err.message}`)
                    }
                })
                .on("end", () => {
                    statements.push(`--- TOTAL STATEMENTS ${n}`);
                    fs.writeFileSync(sqlOutputPath, statements.join("\n"));
                    fs.writeFileSync(reportFilePath, errors.length === 0 ? "No errors" : errors.join("\n"));

                    resolve({ sqlOutputPath, reportFilePath });
                })
                .on("error", (err) => {
                    reject(err);
                })
        });
    }

    mapRowToSqlStatement(inputValues, tableName) {
        const columns = inputValues.map(it => it.column).join(",");
        const values = inputValues.map(it => this.escapeToSQL(it)).join(",");
        const statement = `insert into ${tableName} (${columns}) values (${values});`;
        return statement;
    }

    mapRowToSqlStatements(inputValues, tableName) {
        return inputValues.map(v => this.mapRowToSqlStatement(v, tableName));
    }

    lookupZone(inputZone) {
        if (inputZone === "") return "";
        const normalizedZone = this.normalizeZoneName(inputZone);
        const result = this.zones.find(z => z.zone === normalizedZone);
        if(!result){
            throw Error(`Cannot find zone: ${normalizedZone}`)
        }
        return result.id;
    }

    lookupDistrict(inputDistrict) {
        const normalizedDistrictName = this.normalizeDistrictName(inputDistrict);
        const result = this.districts.find(d => d.district === normalizedDistrictName);
        if(!result){
            throw Error(`Cannot find district: ${normalizedDistrictName}`)
        }
        return result.id;
    }

    lookupMunicipality(inputMunicipality) {
        const normalizedMunicipalityName = this.normalizeMunicipalityName(inputMunicipality);
        const result = this.municipalities.find(m => m.municipality === normalizedMunicipalityName);
        if(!result){
            throw Error(`Cannot find municipality: ${normalizedMunicipalityName}`)
        }
        return result.id;
    }

    // Applies a well known set of transformations to zone names
    normalizeZoneName(zoneName) {
        return zoneName.toLowerCase().trim();
    }

    // Applies a well known set of transformations to district names
    normalizeDistrictName(districtName) {
        return districtName.toLowerCase().trim();
    }

    // Applies a well known set of transformations to municipality names
    normalizeMunicipalityName(municipalityName) {
        return municipalityName.toLowerCase().trim();
    }

    validateStringNotEmpty(row, field) {
        if (row[field].length === 0) {
            throw Error(`Field '${field}' cannot be empty!`);
        }
        return row[field].trim();
    }

    validatePostalCode(row, field) {
        const postalCode = this.validateStringNotEmpty(row, field);
        if (!/^[0-9]{4}-[0-9]{3}/.test(postalCode)) {
            throw Error(`Field '${field}' has invalid postal code format! (value: ${postalCode}')`);
        }
        return postalCode.match(/^[0-9]{4}-[0-9]{3}/);
    }

    validateEmailAddress(row, field) {
        const email = this.validateStringNotEmpty(row, field);
        if (!/^^\S+@\S+$/.test(email)) {
            throw Error(`Field '${field}' has invalid email format! (value: '${email}')`);
        }
        return email;
    }

    validatePhoneNumber(row, field) {
        const phoneNumber = this.validateStringNotEmpty(row, field);
        if (!/^\+{0,1}[0-9]{9,}/.test(phoneNumber)) {
            throw Error(`Field '${field}' has invalid phone number format! (value: '${phoneNumber}')`);
        }
        return phoneNumber;
    }

    transformRow(row) {
        const requestId = uuid.v4();
        const createTimestamp = this.parseDate(row['Timestamp']);
        const items = [];

        if (row["Quantidade de Viseiras"] !== "" && row["Quantidade de Viseiras"] > 0) {
            items.push([
                { column: "id", type: "String", value: uuid.v4() },
                { column: "request_id", type: "String", value: requestId },
                { column: "product_id", type: "String", value: "2c46263c-fb78-47e4-9502-44f1a532f7c5" }, // Product Id of "viseiras"
                { column: "quantity", type: "Number", value: row["Quantidade de Viseiras"] },
                { column: "observations", String: "NullableString", value: "null" },
                { column: "when_created", type: "String", value: createTimestamp },
                { column: "when_modified", type: "String", value: createTimestamp },
                { column: "who_created", type: "String", value: "anonymous" },
                { column: "who_modified", type: "String", value: "anonymous" },
            ]);
        }

        if (row["Quantidade de \"salva-orelhas\""] !== "" && row["Quantidade de \"salva-orelhas\""] > 0) {
            items.push([
                { column: "id", type: "String", value: uuid.v4() },
                { column: "request_id", type: "String", value: requestId },
                { column: "product_id", type: "String", value: "d1c41108-1b18-4939-8f00-69855e74363b" }, // Product Id of "salva-orelhas"
                { column: "quantity", type: "Number", value: row["Quantidade de \"salva-orelhas\""] },
                { column: "observations", String: "NullableString", value: "null" },
                { column: "when_created", type: "String", value: createTimestamp },
                { column: "when_modified", type: "String", value: createTimestamp },
                { column: "who_created", type: "String", value: "anonymous" },
                { column: "who_modified", type: "String", value: "anonymous" },
            ]);
        }

        return {
            timestamp: row['Timestamp'],
            request: [
                { column: "id", type: "String", value: requestId },
                { column: "institution_type_id", type: "String", value: "bceeed6d-9a71-402c-9f81-f7747d63aca2" }, // TODO Fallback
                { column: "institution", type: "String", value: this.validateStringNotEmpty(row, "Instituição") },
                { column: "normalized_institution_name", type: "NullableString", value: row["Nome da Unidade de Saúde (Normalizado)"] },
                { column: "service", type: "String", value: this.validateStringNotEmpty(row, "Serviço Prestado") },
                { column: "district_id", type: "String", value: this.lookupDistrict(row["Distrito / Região"]) },
                { column: "municipality_id", type: "String", value: this.lookupMunicipality(row["Concelho"]) },
                { column: "address", type: "String", value: this.validateStringNotEmpty(row, "Morada") },
                { column: "postal_code", type: "String", value: this.validatePostalCode(row, "Código Postal") },
                { column: "zone_id", type: "NullableString", value: this.lookupZone(row["Zona (Manual)"]) },
                { column: "requester_name", type: "String", value: this.validateStringNotEmpty(row, 'Nome ') }, // do not remove the extra space in the row name
                { column: "requester_email", type: "String", value: this.validateEmailAddress(row, 'Email') },
                { column: "requester_phone_number", type: "String", value: this.validatePhoneNumber(row, 'Telemóvel') },
                { column: "observations", type: "NullableString", value: row['Observações'] },
                { column: "priority", type: "String", value: this.lookupPriority(row['Prioridade (Manual)']) },
                { column: "status", type: "String", value: this.lookupStatus(row['Estado (Manual)']) },
                { column: "when_created", type: "String", value: createTimestamp },
                { column: "when_modified", type: "String", value: createTimestamp },
                { column: "who_created", type: "String", value: "anonymous" },
                { column: "who_modified", type: "String", value: "anonymous" },
                // { column: "claimant", type: "null", value: "null" },
            ],
            items: items
        }
    }

    escapeToSQL(entry) {
        if (entry.type === "String") {
            return `'${entry.value ? entry.value : ""}'`;
        } else if (entry.type === "NullableString") {
            return entry.value ? `'${entry.value}'` : "null";
        } else {
            return entry.value ? entry.value : "";
        }
    }

    parseDate(poorlyFormatedDate){
        return moment(poorlyFormatedDate,'MM/DD/YYYY h:mm:ss').toISOString();
    }

    lookupPriority(priorityInPt){
        if(priorityInPt === "Urgente"){
            return "HIGH";
        }else if(priorityInPt === "Baixo"){
            return "LOW";
        }else{
            return "NORMAL";
        }
    }

    lookupStatus(statusInPt){
        if(statusInPt === "Aceite"){
            return "ACCEPTED";
        }else if(statusInPt === "Em Progresso"){
            return "IN_PROGRESS";
        }else if(statusInPt === "Entregue"){
            return "DELIVERED";
        }else if(statusInPt === "Recusado"){
            return "REJECTED";
        }else if(statusInPt === "Cancelado"){
            return "CANCELED";
        }else{
            return "RECEIVED";
        }
    }
}

module.exports = CsvDataTransformer;