import Papa from "node_modules/papaparse/papaparse"

Papa.SCRIPT_PATH = "node_modules/papaparse/papaparse.js";

function doStuff(data) {
    console.log(data);
}

function parseData(url, callBack) {
    Papa.parse(url, {
		worker: true,
		delimiter: ",",
		header: true,
        download: true,
        dynamicTyping: true,
		step: function(results) {
			//console.log("Row data:", results.data);
		},
        complete: function(results) {
            callBack(results.data);
        }
    });
}

parseData("../../data/data_co2.csv", doStuff);