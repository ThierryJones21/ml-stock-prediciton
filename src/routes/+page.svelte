<script>
// @ts-nocheck

	// import { chart } from "svelte-apexcharts";
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';
	import * as tf from '@tensorflow/tfjs';
	import { getStockData } from '$lib/stock-api'; 
	const modelPath = '/tensorflow/model_v2/model.json';
	
	let chartInstance;

	let stock_symbols = [
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'AAPL', name: 'Apple Inc' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
        { symbol: 'META', name: 'Meta Platforms, Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'GOOG', name: 'Alphabet Inc.' },
        { symbol: 'BRK.B', name: 'Berkshire Hathaway Inc.' },
        { symbol: 'TSLA', name: 'Tesla, Inc.' },
        { symbol: 'AVGO', name: 'Broadcom Inc.' },
        { symbol: 'LLY', name: 'Eli Lilly and Company' },
        { symbol: 'JPM', name: 'JPMorgan Chase & Co.' },
        { symbol: 'UNH', name: 'UnitedHealth Group Incorporated' },
        { symbol: 'V', name: 'Visa Inc.' },
        { symbol: 'XOM', name: 'Exxon Mobil Corporation' },
        { symbol: 'JNJ', name: 'Johnson & Johnson' },
        { symbol: 'MA', name: 'Mastercard Incorporated' },
        { symbol: 'PG', name: 'The Procter & Gamble Company' },
        { symbol: 'HD', name: 'The Home Depot, Inc.' },
        { symbol: 'COST', name: 'Costco Wholesale Corporation' },
        { symbol: 'MRK', name: 'Merck & Co., Inc.' },
        { symbol: 'ABBV', name: 'AbbVie Inc.' },
        { symbol: 'ADBE', name: 'Adobe Inc.' },
        { symbol: 'CRM', name: 'Salesforce, Inc.' },
        { symbol: 'AMD', name: 'Advanced Micro Devices, Inc.' },
        { symbol: 'CVX', name: 'Chevron Corporation' },
        { symbol: 'NFLX', name: 'Netflix, Inc.' },
        { symbol: 'WMT', name: 'Walmart Inc.' },
        { symbol: 'BAC', name: 'Bank of America Corporation' },
        { symbol: 'PEP', name: 'PepsiCo, Inc.' },
        { symbol: 'KO', name: 'The Coca-Cola Company' },
        { symbol: 'ACN', name: 'Accenture plc' },
        { symbol: 'MCD', name: 'McDonald\'s Corporation' },
        { symbol: 'TMO', name: 'Thermo Fisher Scientific Inc.' },
        { symbol: 'CSCO', name: 'Cisco Systems, Inc.' },
        { symbol: 'ABT', name: 'Abbott Laboratories' },
        { symbol: 'LIN', name: 'Linde plc' },
        { symbol: 'CMCSA', name: 'Comcast Corporation' },
        { symbol: 'WFC', name: 'Wells Fargo & Company' },
        { symbol: 'INTC', name: 'Intel Corporation' },
        { symbol: 'VZ', name: 'Verizon Communications Inc.' },
        { symbol: 'ORCL', name: 'Oracle Corporation' },
        { symbol: 'INTU', name: 'Intuit Inc.' },
        { symbol: 'DIS', name: 'The Walt Disney Company' },
        { symbol: 'AMGN', name: 'Amgen Inc.' },
        { symbol: 'IBM', name: 'International Business Machines Corporation' },
        { symbol: 'QCOM', name: 'QUALCOMM Incorporated' },
        { symbol: 'DHR', name: 'Danaher Corporation' },
        { symbol: 'NOW', name: 'ServiceNow, Inc.' },
        { symbol: 'CAT', name: 'Caterpillar Inc.' }
    ];

	let Chart_Apex;
	let model;
	let options;
	let loading = false;
	let chartData;
	let symbol = 'ORCL'; // Default stock symbol
	let start_date = '2023-09-10'; // Default start date
	let end_date = '2024-02-01'; // Default end date
	let future_days = 7; // Default number of future days to predict

	let data = [];
	let futureData = [];
  
	async function loadModel() {
	  try {
		loading = true;
		model = await tf.loadLayersModel(modelPath);
	  } catch (error) {
		console.error('Error loading model:', error);
	  } finally {
		loading = false;
	  }
	}
	onMount(loadModel);

	onMount(async () => {
		if (typeof window !== 'undefined') {
			const module = await import('svelte-apexcharts');
			Chart_Apex = module.Chart_Apex;
		}
	});

  	async function predict(symbol, start_date, end_date, future_days) {
		if (!model) {
			console.error('Model not loaded.');
			return;
		}
		const seq_length = 20;

		try {
			// Fetch data
			const stock_data = await getStockData(symbol, start_date, end_date);

			console.log("stock data directly from API:", stock_data['historical'])

			// Preprocess data
			let { scaled_data, scaler, dates } = await preprocessData(stock_data['historical']);

			console.log("scaled data after preprocess stage:", scaled_data)

			// // Create sequences
			let [X, y] = createSequences(scaled_data, seq_length);

			console.log("X after sequence stage:", X)

			// Predict using the loaded model
			const model = await tf.loadLayersModel(modelPath);

			// Reshape data for LSTM
			X = tf.tensor(X);
			X = X.reshape([X.shape[0],X.shape[1], 1]);

			console.log("X after reshape:", X)
			// Predict using the trained model
			const y_pred = model.predict(X);
			console.log("Y predict:", y_pred)

			// Inverse transform the predicted and actual values
			// Inverse transform the predicted and actual values
			const y_actual = y.map(value => value * (scaler.maxValue - scaler.minValue) + scaler.minValue);

			const y_pred_array = y_pred.arraySync();
			const y_pred_actual = y_pred_array.map(value => value * (scaler.maxValue - scaler.minValue) + scaler.minValue);
			// console.log(y_actual)
			// console.log(y_pred_actual)
			// console.log(dates)


			// Combine actual and predicted prices with their corresponding dates
			const newData = [];
			for (let idx = 0; idx < dates.length; idx++) {
				const date = dates[idx];
				const actual = y_actual[idx];
				const predicted = y_pred_actual[idx];
				if (actual !== undefined && predicted !== undefined) {
					newData.push({ date, actualPrice: actual, predictedPrice: predicted });
				}
			}
			//update data for chart and table
			data = newData;

			// Predict future prices
			const future_prices = [];
			// Get the last element of X along the first axis
			const lastIndex = X.shape[0] - 1;
			console.log("LAST INDEX:", X.arraySync())
			let X_extend = tf.slice(X, [lastIndex, 0, 0], [1, X.shape[1], X.shape[2]]);
			
			// console.log("y_actual array", y_actual.reverse())
			// let X_extend = tf.tensor([[[y_actual[y_actual.length - 1]]]]);

			console.log("XEXTEND", X_extend)

			for (let i = 0; i < future_days; i++) {
				//predict the future price 
				const future_price_tensor = model.predict(X_extend);
				const future_price_array = future_price_tensor.arraySync();
				const future_price_actual = future_price_array.map(value => value * (scaler.maxValue - scaler.minValue) + scaler.minValue);

				//add new future price to list
				future_prices.push(future_price_actual);

				//add new input as teh prediction array of the last model.predict and add to X_extend
				const updatedInput = [...X_extend.arraySync()[0].slice(1), future_price_array];

				X_extend = tf.tensor(updatedInput).reshape([1, X_extend.shape[1], 1]);
			}

			let future_dates_gen = generateDateRange(new Date(dates[0]), future_days);

			// Prepare data for console.table
			let newfutureData;
			newfutureData = future_dates_gen.map((date, idx) => ({
				date: date.toISOString().split('T')[0],
				predictedPrice : future_prices[idx][0] // Assuming each prediction is a single value
			}));

			futureData = newfutureData;
			// Call the function to update chart data
			updateChart();
		} catch (error) {
			console.error('Error predicting stock prices:', error);
		} finally {
			loading = false;
		}
	}

	function generateDateRange(startDate, numberOfDays) {
		const dates = [];
		for (let i = 0; i < numberOfDays; i++) {
			const date = new Date(startDate);
			date.setDate(startDate.getDate() + i);
			dates.push(date);
		}
		return dates;
	}
  
	async function preprocessData(data) {
		const closingPrices = data.map(day => day.close);
		// Calculate min and max values
		const minValue = Math.min(...closingPrices);
		const maxValue = Math.max(...closingPrices);
		// Normalize the data
		const scaledData = closingPrices.map(price => [(price - minValue) / (maxValue - minValue)]);
		const dates = data.map(day => day.date);
		return {
			scaled_data: scaledData,
			scaler: { minValue, maxValue },
			dates: dates
		};
	}

	function createSequences(data, seq_length) {
		const X = [];
		const y = [];
		// Pad the input data with 0.5 at the beginning
		const paddedData = Array(seq_length - 1).fill(0.5).concat(data);
		// Create sequences starting from index seq_length - 1
		for (let i = seq_length - 1; i <= paddedData.length - 1; i++) {
			const sequence = [];
			for (let j = 0; j < seq_length; j++) {
				sequence.push([paddedData[i - seq_length + 1 + j]]);
			}
			X.push(sequence);
			y.push([paddedData[i + 1]]);
		}
		return [X, y];
	}

	function updateChart() {
		if (chartInstance) {
			chartInstance.destroy();
		}
		const ctx = document.getElementById('myChart');
		// current dates selected
		const DataDates = data.map(entry => entry.date).reverse();
		const DataActualPrices = data.map(entry => entry.actualPrice).reverse();
		const DataPredictedPrices = data.map(entry => entry.predictedPrice).reverse();
		//future dates selected
		const FutureDataDates = futureData.map(entry => entry.date);
		const FutureDataPredictedPrices = futureData.map(entry => entry.predictedPrice);

		const allPredictedPrices = [...DataPredictedPrices, ...FutureDataPredictedPrices];

		chartInstance = new Chart(ctx, {
			type: 'line',
			data: {
				labels: [...DataDates, ...FutureDataDates],
				datasets: [
					{
						label: 'Actual Price',
						data: DataActualPrices,
						borderColor: 'rgba(75, 192, 192, 1)',
						tension: 0.1
					},
					{
						label: 'Predicted Price',
						data: DataPredictedPrices,
						borderColor: 'rgba(255, 99, 132, 1)',
						tension: 0.1
					},
					{
						label: 'Future Predicted Price',
						data: allPredictedPrices,
						borderColor: 'rgba(54, 162, 235, 1)', // Choose your own color
						tension: 0.1
					}
				]
			}
		});
	}
</script>
  
<section>
	<h1>Stock Prediction</h1>
	
	<div>
		<label for="symbol">Stock Symbol:</label>
		<input type="text" id="symbol" bind:value={symbol} placeholder="AAPL">
	</div>
	<div>
		<label for="symbol">Stock Symbol:</label>
		<select id="symbol" bind:value={symbol}>
			{#each stock_symbols as { symbol, name }}
				<option value={symbol}>{symbol} - {name}</option>
			{/each}
		</select>
	</div>
	<div>
		<label for="start_date">Start Date:</label>
		<input type="date" id="start_date" bind:value={start_date}>
	</div>
	<div>
		<label for="end_date">End Date:</label>
		<input type="date" id="end_date" bind:value={end_date}>
	</div>
	<div>
		<label for="future_days">Future Days:</label>
		<input type="number" id="future_days" bind:value={future_days} min="1" max="30">
	</div>
	<button on:click={() => predict(symbol, start_date, end_date, future_days)}>Predict Stock Price</button>
	<div>{symbol}</div>
	
	
	<canvas id="myChart"></canvas>
	
	<div class="tables-container">
		<div >
		<h3>Current Data</h3>
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Actual Price</th>
						<th>Predicted Price</th>
					</tr>
				</thead>
				<tbody>
					{#each data as entry}
						<tr>
							<td>{entry.date}</td>
							<td>{entry.actualPrice}</td>
							<td>{entry.predictedPrice}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Future Data Table -->
		<div >
			<h3>Future Predictions</h3>
			<table>
				<thead>
					<tr>
						<th>Date</th>
						<th>Predicted Price</th>
					</tr>
				</thead>
				<tbody>
					{#each futureData as entry}
						<tr>
							<td>{entry.date}</td>
							<td>{entry.predictedPrice}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div id="chart"></div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}

	h1 {
		width: 100%;
	}

	/* CSS for tables container */
    .tables-container {
        display: flex; /* Display tables side by side */
    }

    /* CSS for individual tables */
    .tables-container > div {
        flex: 1; /* Each table takes up equal width */
        margin-right: 20px; /* Add some space between tables */
    }

    /* Additional CSS styling for tables and table elements if needed */
</style>