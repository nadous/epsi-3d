import Papa from "node_modules/papaparse/papaparse"

Papa.SCRIPT_PATH = "node_modules/papaparse/papaparse.js";

parseData("../../data/data_co2.csv", doStuff);

function parseData(url, callBack) {
	Papa.parse(url, {
		delimiter: ",",
		header: true,
        download: true,
		complete: function(results, file) {
				//console.log("Finished:", results.data);
			var result=[];
			results.data.forEach(function (value) {
			  console.log(value);
			  result[value["Country Name"]] = value["2013"];
			});
			console.log(results.data);
			callBack(result);
		}
    });
}

function doStuff(data) {
    console.log(data);
}