<script>
// @ts-nocheck

	// import { chart } from "svelte-apexcharts";
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';
	import * as tf from '@tensorflow/tfjs';
	import { getStockData } from '$lib/stock-api'; 
	const modelPath = '/tensorflow/model_v2/model.json';

	import { Table, Autocomplete } from '@skeletonlabs/skeleton';
  	// import StockSymbolSelect from '../components/StockSymbolSelect.svelte';

	
	let chartInstance;
	let inputDemo = '';

	let stock_symbols = [
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'AAPL', name: 'Apple Inc' },
        { symbol: 'NVDA', name: 'NVIDIA Corporation' },
        { symbol: 'AMZN', name: 'Amazon.com, Inc.' },
        { symbol: 'META', name: 'Meta Platforms, Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
		{ symbol: 'MCD', name: "McDonald's Corp"},
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
	let flavorOptions = stock_symbols.map(stock => ({
		label: `${stock.name} (${stock.symbol})`,
		value: stock.symbol.toLowerCase(), // Convert symbol to lowercase for consistency
		keywords: `${stock.symbol.toLowerCase()}, ${stock.name.toLowerCase()}`, // Include symbol and name as keywords
		meta: { company: stock.name }
	}));
	console.log(flavorOptions)


	let Chart_Apex;
	let model;
	let options;
	let loading = false;
	let chartData;
	let symbol = 'ORCL'; // Default stock symbol
	let today = new Date();
	today.setMonth(today.getMonth() - 3); // Subtract six months
  	let start_date = today.toISOString().split('T')[0];
	let today_2 = new Date();
	today_2.setDate(today_2.getDate() - 1); // Subtract one day
	let end_date = today_2.toISOString().split('T')[0]; 	
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

	function onFlavorSelection(event) {
		symbol = event.detail.value.toUpperCase();
	}



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
					newData.push({ date, actualPrice: actual, predictedPrice: predicted.toFixed(2) });
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
				predictedPrice : future_prices[idx][0].toFixed(2) // Assuming each prediction is a single value
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
	<div class="sidebar-left">
		<div class="input-container">
			<label for="symbol">Stock Symbol:</label>
			<input type="text" id="symbol" bind:value={symbol} placeholder="AAPL">
		</div>
		<div class="input-container">
			<label for="symbol">Select Stock:</label>
			<!-- Replace the input/select with the Autocomplete component -->
			<div class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto">
				<div class="flex flex-col  w-full"> <!-- Container for stacking elements -->
					<input class="input w-full mb-2" type="search" name="demo" bind:value={inputDemo} placeholder="Search..." />
					<Autocomplete 
						class="w-full" 
						bind:input={inputDemo} 
						options={flavorOptions} 
						on:selection={onFlavorSelection} 
					/>
				</div>
			</div>
					
		</div>
		<div class="input-container">
			<label for="start_date">Start Date:</label>
			<input type="date" id="start_date" bind:value={start_date}>
		</div>
		<div class="input-container">
			<label for="end_date">End Date:</label>
			<input type="date" id="end_date" bind:value={end_date}>
		</div>
		<div class="input-container">
			<label for="future_days">Future Days:</label>
			<input type="number" id="future_days" bind:value={future_days} min="1" max="14">
		</div>
		<div class="input-container">
			<button class="btn btn-filled-primary" on:click={() => predict(symbol, start_date, end_date, future_days)}>Predict Stock Price</button>
		</div>
	</div>
	
	
	<div class="main-content">
		<canvas id="myChart"></canvas>
	</div>
	<div class="right-content">
		<Table
			source={
				data.length > 1 ? // Check if data is not empty
				{
					head: ['Dates', '$ Actual', ' $ Predicted'],
					body: [
					
					...futureData.map(({ date, predictedPrice }) => [date, 'N/A', predictedPrice]),
					...data.map(({ date, actualPrice, predictedPrice }) => [date, actualPrice, predictedPrice])
					],
					foot: ['Total', '', data.length + futureData.length]
				}
				: // If data is empty
				{
					head: ['Dates', 'actualPrice', 'predictedPrice'],
					body: [[0, 0, 0]], // Display 0 values if data is empty
					foot: ['Total', '', 0]
				}
			}
		/>

	</div>
</section>

<style>
	section {
		margin-top: 3vw;
		display: flex;
		flex-direction: row;
		width: 100%;
	}
	.sidebar-left, .main-content, .right-content {
		padding: 10px;
	}

	.sidebar-left, .right-content {
		flex: 0.5; /* Adjust the flex value to make it less wide */
	}

	.sidebar-left{
		margin-left: 3vw;
		display: flex;
    	flex-direction: column;
		width: 150px;

	}

	.right-content{
		margin-right: 3vw;
		width: 200px;
	}

	.input-container {
		padding: 10px 0; /* Adjust the padding as needed */
		display: flex;
		align-items: center;
	}

	label {
		width: 75px; /* Adjust the width of the labels as needed */
		padding-right: 10px; /* Adjust the spacing between label and input/select */
	}

	input, select, button {
		flex: 1;
	}

	.main-content {
		flex: 1; /* The other two columns will equally share the available space */
	}

</style>
