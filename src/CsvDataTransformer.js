const fs = require("fs");
const path = require("path");

const CsvParser = require("csv-parser");
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
        const sqlOutputPath = path.join(inputFilePath, `${new Date().toISOString()}_output.sql`);
        const reportFilePath = path.join(inputFilePath, `${new Date().toISOString()}_report.txt`);

        const statements = [`--- Output file generated from ${inputFilePath}---`];
        const errors = [];
        
        console.log("TODO");

        fs.writeFileSync(sqlOutputPath, statements.join("\n"));
        fs.writeFileSync(reportFilePath, errors.length === 0 ? "No errors": errors.join("\n"));
        return { sqlOutputPath, reportFilePath }
    }


    lookupZone(inputZone) {
        const normalizedZone = this.normalizeZoneName(inputZone);
        return this.zones.find(z => z.zone === normalizedZone);
    }

    lookupDistrict(inputDistrict) {
        const normalizedDistrictName = this.normalizeDistrictName(inputDistrict);
        return this.districts.find(d => d.district === normalizedDistrictName);
    }

    lookupMunicipality(inputMunicipality) {
        const normalizedMunicipalityName = this.normalizeMunicipalityName(inputMunicipality);
        return this.municipalities.find(m => m.municipality === normalizedMunicipalityName);
    }

    // Applies a well known set of transformations to zone names
    normalizeZoneName(zoneName) {
        return zoneName.toLowerCase();
    }

    // Applies a well known set of transformations to district names
    normalizeDistrictName(districtName) {
        return districtName.toLowerCase();
    }

    // Applies a well known set of transformations to municipality names
    normalizeMunicipalityName(municipalityName) {
        return municipalityName.toLowerCase();
    }
}

module.exports = CsvDataTransformer;