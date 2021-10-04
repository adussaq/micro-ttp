(function() {
	'use strict';

	console.log("WELCOME");

	const COLORS = [
		'rgb(255, 99, 132)',
		'rgb(54, 162, 235)',
		'rgb(255, 205, 86)'
	];

	const addChart = function(addElems, title) {
		let $elem = $('<canvas>');
		$('<div>', {
				class: "col col-xs-12 col-sm-6 col-md-4 text-center",
				style: "margin-bottom: 2em"
			})
			.append($('<div>', {class: "h3", text: title}))
			.append($elem)
			.append(addElems)
			.appendTo($("#chartRow"));

		return $elem;
	}

	let createByDay = function(pageObj) {
		let data = pageObj.flat;
		let $slider = $('<div>', {
			class: "slider-styled slider-square"
		});
		let $elem = addChart($slider, "Positive Cases By Day");
		let removed = {};

		const getDataArr = function(data) {
			// 3: "Hours to positivity"
			let hashOfTimes = {};
			let max = 0;
			let min = Infinity;
			data.forEach(function(row) {
				let hours = Math.floor(row[3] / 24 * 4) / 4;
				hashOfTimes[hours] = hashOfTimes[hours] || 0;
				hashOfTimes[hours] += 1;
				if (max < hours) {
					max = hours;
				}
				if (min > hours) {
					min = hours;
				}
			});

			let labelsArr = [];
			let valuesArr = [];
			for (let i = min; i <= max + .1; i += 0.25) {
				let val = 0;
				if (hashOfTimes.hasOwnProperty(i)) {
					val = hashOfTimes[i];
				}
				labelsArr.push(i);
				valuesArr.push(val);
			}
			return {
				max: max,
				min: min,
				labels: labelsArr,
				values: valuesArr
			};
		};

		// let arrOfTimes = Object.keys(hashOfTimes).map(a => [a * 1, hashOfTimes[a]]).sort((a, b) => a[0] - b[0]);

		let dataObj = getDataArr(data);

		var ctx = $elem[0];
		var myChart = new Chart(ctx, {
			type: 'bar',
			data: {
				labels: dataObj.labels,
				datasets: [{
					barPercentage: 1,
					categoryPercentage: 0.95,
					label: "Number of Cases",
					data: dataObj.values,
					backgroundColor: COLORS[1],
					// borderWidth: 1
				}]
			},
			options: {
				responsive: true,
				maintainAspectRatio: true,
				aspectRatio: 1,
				scales: {
					y: {
						title: {
							display: true,
							text: "Number of Cases",
							font: {
								size: 20,
								weight: 'bold'
							},
						},
						ticks: {
							font: {
								size: 16
							},
						},
						beginAtZero: true
					},
					x: {
						title: {
							display: true,
							text: "Days Post Collection",
							font: {
								size: 20,
								weight: 'bold'
							},
						},
						ticks: {
							font: {
								size: 16
							},
						}
					}
				},
				plugins: {
					legend: {
						display: false
					},
				}
			}
		});


		console.log(myChart.options.scales)

		let retObj = {
			update: function() {
				let udata = pageObj.flat;
				let udataObj = getDataArr(udata);
				// console.log(udataObj, udata);
				myChart.data.labels = udataObj.labels;
				myChart.data.datasets[0].data = udataObj.values;
				// console.log(myChart.data.datasets);
				myChart.update();
			},
			filter: data.map(a => 1)
		};

		noUiSlider.create($slider[0], {
			start: [0, dataObj.max + 0.25],
			tooltips: true,
			connect: true,
			step: 0.25,
			range: {
				'min': 0,
				'max': dataObj.max + 0.25
			}
		}).on('change', function(evt) {

			let filterOut = {};
			// 3: "Hours to positivity"
			console.log(evt);
			pageObj.original.flat.forEach(function(row, ind) {
				let days = row[3] / 24;
				if (days < evt[0] || days > evt[1]) {
					retObj.filter[ind] = 0;
				} else {
					retObj.filter[ind] = 1;
				}
			});
			console.log(evt);
			pageObj.update();
		});
		return retObj;
	};

	const createDonut = function(pageObj, rowInd, chartSettings) {
		let allowed = {};
		let retObj = {
			filter: pageObj.original.flat.map(row => 1)
		};

		let getFilteredData = function () {
			let ddArr = [];
			pageObj.original.flat.forEach(function (row, ind) {
				let countOut = 0;
				let minCount = 1;
				if (!retObj.filter[ind]) {
					minCount += 1;
				}
				pageObj.elements.forEach(function (pageElem) {
					if (!pageElem.filter[ind]) {
						countOut += 1;
					}
				});
				// console.log(countOut, minCount);
				if (countOut < minCount) {
					ddArr.push(row);
				}

			});
			// console.log(ddArr);
			return ddArr;
		}

		let getDataArr = function() {
			let data = getFilteredData();
			let organismTally = {};
			let updateColors = 0;
			let colors = COLORS;
			// 6: ['Organism Name']
			data.forEach(function(row) {
				if (rowInd === 6) {
					row[6].forEach(function(org) {
						organismTally[org] = organismTally[org] || 0;
						organismTally[org] += 1;
					});
				} else {
					organismTally[row[rowInd]] = organismTally[row[rowInd]] || 0;
					organismTally[row[rowInd]] += 1;
				}
			});

			let labelSort = chartSettings.sort || function (a, b) {
				return organismTally[b] * 1 - organismTally[a] * 1;
			};

			let organismTallyArr = Object.keys(organismTally).sort(labelSort);
			let labelArr = organismTallyArr;
			labelArr = labelArr.map(function (a) {
				let ret = a;
				if (chartSettings.labels) {
					ret = chartSettings.labels[a];
				}
				if (!allowed.hasOwnProperty(ret)) {
					allowed[ret] = 1
				} else if(!allowed[a]) {
					updateColors = 1;
				}
				
				return ret;
			});

			if (updateColors) {
				let count = 0;
				colors = labelArr.map(function (org) {
					let ret = "grey";
					if(allowed[org]) {
						ret = colors[count % COLORS.length];
						count += 1;
					}
					return ret;
				});
			}

			// console.log('in update', colors, labelArr);

			return {
				labels: labelArr,
				values: organismTallyArr.map(a => organismTally[a]),
				colors: colors
			};
		};

		let filterOnAllowed = function () {
			retObj.filter = pageObj.original.flat.map(function (row) {
				let ret = 0;
				if (rowInd === 6) {
					ret = 0;
					row[6].forEach(function (org) {
						if (allowed[org]) {
							ret = 1;
						}
					});
				} else {
					let tt = row[rowInd];
					if  (chartSettings.labels) {
						tt = chartSettings.labels[tt];
					}
					if (allowed[tt]) {
						ret = 1;
					}
				}
				return ret;
			});
		};

		let chartData = getDataArr(pageObj.flat);
		let $btn = $('<button>', {class: 'btn row btn-primary', style: "width:90%; margin-left: 5%;margin-top:10px;", text: 'reset'});
		let $elem = addChart($btn, chartSettings.title);

		const figData = {
			labels: chartData.labels,
			datasets: [{
				data: chartData.values,
				backgroundColor: COLORS,
				hoverOffset: 4
			}]
		};
		const config = {
			type: 'doughnut',
			data: figData,
			options: {
				plugins: {
					legend: {
						display: false,
						maxHeight: 0,
						maxWidth: 0,
						position: 'bottom'
					}
				},
				onClick: function (evt) {
					// console.log('clicked', evt);
					let clicked = myChart.getElementsAtEventForMode(evt, 'nearest', { intersect: true }, false);
					// let selectedIndex = activePoints[0]._index;
					evt.native.preventDefault();
					let organismClicked = chartData.labels[clicked[0].element.$context.index];
					if (evt.native.shiftKey || evt.native.metaKey || evt.native.ctrlKey) {
						allowed[organismClicked] = (allowed[organismClicked] + 1) % 2;
					} else if (!allowed[organismClicked]) {
						allowed[organismClicked] = 1;
					} else {
						Object.keys(allowed).forEach(function (org) {
							if (org === organismClicked) {
								allowed[org] = 1;
							} else {
								allowed[org] = 0;
							}
						});
					}
					filterOnAllowed();
					pageObj.update();
				    console.log(allowed, organismClicked, evt.native.shiftKey, evt.native.metaKey, evt.native.ctrlKey);
				}
			}
		};

		$btn.click(function (evt) {
			evt.preventDefault();
			Object.keys(allowed).forEach(function (key) {
				allowed[key] = 1;
			});
			filterOnAllowed();
			pageObj.update();
		})

		var ctx = $elem[0];
		var myChart = new Chart(ctx, config);

		retObj.update = function() {
			let udata = pageObj.flat;
			chartData = getDataArr(udata); // update chartData
			myChart.data.labels = chartData.labels;
			myChart.data.datasets[0].data = chartData.values;
			myChart.data.datasets[0].backgroundColor = chartData.colors;
			// console.log(chartData.colors);
			// console.log(myChart.data.datasets);
			myChart.update();
		};
		return retObj;
	}

	const numSortUp = function (a, b) {
		return a - b;
	}
	const numSortDown = function (a, b) {
		return b - a;
	}

	const buildPage = function(data) {
		console.log(data);
		let flattened = data.data.reduce((a, b) => a.concat(b));

		// 0: "Test Name"
		// 1: "Collection Year"
		// 2: "Randomized Collect Time"
		// 3: "Hours to positivity"
		// 4: "False Positive"
		// 5: "Positive/Negative"
		// 6: ['Organism Name']

		let pageObj = {
			original: {
				data: data.data,
				flat: flattened
			},
			elements: [],
			data: JSON.parse(JSON.stringify(data)),
			flat: JSON.parse(JSON.stringify(flattened))
		};
		pageObj.elements = [
			createByDay(pageObj),
			createDonut(pageObj, 6, {title: "Organism Isloated"}),
			createDonut(pageObj, 4, {title: "Positive by export", sort: numSortUp, labels:{"0": "True Positive", "1": "False Positive"}}),
			createDonut(pageObj, 0, {title: "Test Type"}),
			createDonut(pageObj, 1, {title: "Positive Cases By Year", sort: numSortUp}),
		];
		pageObj.update = function() {
			pageObj.flat = pageObj.original.flat.filter(function(row, ind) {
				let ret = true;
				pageObj.elements.forEach(function (elemObj) {
					if (!elemObj.filter[ind]) {
						ret = false;
					}
				});
				return ret;
			})
			pageObj.elements.forEach(a => a.update());
		};

		console.log(pageObj);
	};




	fetch('sanatizedCombinedData.json').then(resp => resp.json()).then(buildPage);
}())