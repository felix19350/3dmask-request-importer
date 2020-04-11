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
                        const statementParams = this.transformRow(row);
                        const columns = statementParams.map(it => it.column).join(",");
                        const values = statementParams.map(it => this.escapeToSQL(it)).join(",");
                        const statement = `insert into shield_request (${columns}) values (${values});`;
                        statements.push(statement);
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

    lookupZone(inputZone) {
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

    transformRow(row) {
        return [
            { column: "id", type: "String", value: uuid.v4() },
            { column: "entity", type: "String", value: row["Unidade de saúde"] },
            { column: "service", type: "String", value: row["Serviço"] },
            { column: "district_id", type: "String", value: this.lookupDistrict(row["Distrito / Região"]) },
            { column: "municipality_id", type: "String", value: this.lookupMunicipality(row["Concelho"]) },
            { column: "address", type: "String", value: row["Morada"] },
            { column: "postal_code", type: "String", value: row["Código Postal"] },
            { column: "requester_name", type: "String", value: row['Nome '] }, // do not remove the extra space in the row name
            { column: "requester_email", type: "String", value: row['Email'] },
            { column: "requester_phone_number", type: "String", value: row['Telemóvel'] },
            { column: "quantity", type: "Number", value: row['Quantidade'] },
            { column: "observations", type: "String", value: row['Observações'] },
            { column: "priority", type: "String", value: this.lookupPriority(row['Prioridade (Manual)']) },
            { column: "status", type: "String", value: this.lookupStatus(row['Estado (Manual)']) },
            { column: "zone_id", type: "String", value: this.lookupZone(row["Zona (Manual)"]) },
            { column: "normalized_entity_name", type: "String", value: row["Nome da Unidade de Saúde (Normalizado)"] },
            { column: "when_created", type: "String", value: this.parseDate(row['Timestamp']) },
            { column: "when_modified", type: "String", value: this.parseDate(row['Timestamp']) },
            { column: "who_created", type: "String", value: "system" },
            { column: "who_modified", type: "String", value: "system" },
        ]
    }

    escapeToSQL(entry) {
        if (entry.type === "String") {
            return `'${entry.value ? entry.value : ""}'`;
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