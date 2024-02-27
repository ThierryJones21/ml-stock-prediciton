<script>
// @ts-nocheck

	// import { chart } from "svelte-apexcharts";
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';
	import * as tf from '@tensorflow/tfjs';
	import { getStockData } from '$lib/stock-api'; 
	const modelPath = '/tensorflow/model_v3/model.json';

	import { Table, Autocomplete, InputChip, ProgressBar } from '@skeletonlabs/skeleton';
  	// import StockSymbolSelect from '../components/StockSymbolSelect.svelte';

	
	let chartInstance;
	let inputDemo = '';
	let inputChip = '';
	let inputChipList = ['']
	// ['Energy', 'Tech', 'Food', 'Utilities','Healthcare', 'Financials']

	let stock_symbols = [
		{ symbol: 'XOM', name: 'Exxon Mobil Corporation', sector: 'Energy' },
		{ symbol: 'CVX', name: 'Chevron Corporation', sector: 'Energy' },
		{ symbol: 'EOG', name: 'EOG Resources, Inc.', sector: 'Energy' },
		{ symbol: 'PTR', name: 'PetroChina Company Limited', sector: 'Energy' },
		{ symbol: 'TOT', name: 'TotalEnergies SE', sector: 'Energy' },
		{ symbol: 'BP', name: 'BP p.l.c.', sector: 'Energy' },
		{ symbol: 'ENB', name: 'Enbridge Inc.', sector: 'Energy' },
		{ symbol: 'SLB', name: 'Schlumberger Limited', sector: 'Energy' },
		{ symbol: 'KMI', name: 'Kinder Morgan, Inc.', sector: 'Energy' },
		{ symbol: 'COP', name: 'ConocoPhillips', sector: 'Energy' },
		{ symbol: 'AAPL', name: 'Apple Inc.', sector: 'Tech' },
		{ symbol: 'MSFT', name: 'Microsoft Corporation', sector: 'Tech' },
		{ symbol: 'GOOGL', name: 'Alphabet Inc.', sector: 'Tech' },
		{ symbol: 'AMZN', name: 'Amazon.com Inc.', sector: 'Tech' },
		{ symbol: 'FB', name: 'Meta Platforms, Inc.', sector: 'Tech' },
		{ symbol: 'TSLA', name: 'Tesla, Inc.', sector: 'Tech' },
		{ symbol: 'NVDA', name: 'NVIDIA Corporation', sector: 'Tech' },
		{ symbol: 'INTC', name: 'Intel Corporation', sector: 'Tech' },
		{ symbol: 'ADBE', name: 'Adobe Inc.', sector: 'Tech' },
		{ symbol: 'CRM', name: 'salesforce.com, inc.', sector: 'Tech' },
		{ symbol: 'KO', name: 'The Coca-Cola Company', sector: 'Food' },
		{ symbol: 'PEP', name: 'PepsiCo, Inc.', sector: 'Food' },
		{ symbol: 'MCD', name: "McDonald's Corporation", sector: 'Food' },
		{ symbol: 'NKE', name: 'NIKE, Inc.', sector: 'Food' },
		{ symbol: 'SBUX', name: 'Starbucks Corporation', sector: 'Food' },
		{ symbol: 'MDLZ', name: 'Mondelez International, Inc.', sector: 'Food' },
		{ symbol: 'KHC', name: 'The Kraft Heinz Company', sector: 'Food' },
		{ symbol: 'YUM', name: 'Yum! Brands, Inc.', sector: 'Food' },
		{ symbol: 'DRI', name: 'Darden Restaurants, Inc.', sector: 'Food' },
		{ symbol: 'GIS', name: 'General Mills, Inc.', sector: 'Food' },
		{ symbol: 'NEE', name: 'NextEra Energy, Inc.', sector: 'Utilities' },
		{ symbol: 'DUK', name: 'Duke Energy Corporation', sector: 'Utilities' },
		{ symbol: 'SO', name: 'The Southern Company', sector: 'Utilities' },
		{ symbol: 'D', name: 'Dominion Energy, Inc.', sector: 'Utilities' },
		{ symbol: 'EXC', name: 'Exelon Corporation', sector: 'Utilities' },
		{ symbol: 'AEP', name: 'American Electric Power Company, Inc.', sector: 'Utilities' },
		{ symbol: 'SRE', name: 'Sempra Energy', sector: 'Utilities' },
		{ symbol: 'PEG', name: 'Public Service Enterprise Group Incorporated', sector: 'Utilities' },
		{ symbol: 'XEL', name: 'Xcel Energy Inc.', sector: 'Utilities' },
		{ symbol: 'WEC', name: 'WEC Energy Group, Inc.', sector: 'Utilities' },
		{ symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Healthcare' },
		{ symbol: 'PFE', name: 'Pfizer Inc.', sector: 'Healthcare' },
		{ symbol: 'UNH', name: 'UnitedHealth Group Incorporated', sector: 'Healthcare' },
		{ symbol: 'MRK', name: 'Merck & Co., Inc.', sector: 'Healthcare' },
		{ symbol: 'ABBV', name: 'AbbVie Inc.', sector: 'Healthcare' },
		{ symbol: 'LLY', name: 'Eli Lilly and Company', sector: 'Healthcare' },
		{ symbol: 'ABT', name: 'Abbott Laboratories', sector: 'Healthcare' },
		{ symbol: 'AMGN', name: 'Amgen Inc.', sector: 'Healthcare' },
		{ symbol: 'GILD', name: 'Gilead Sciences, Inc.', sector: 'Healthcare' },
		{ symbol: 'BMY', name: 'Bristol-Myers Squibb Company', sector: 'Healthcare' },
		{ symbol: 'JPM', name: 'JPMorgan Chase & Co.', sector: 'Financials' },
		{ symbol: 'BAC', name: 'Bank of America Corporation', sector: 'Financials' },
		{ symbol: 'WFC', name: 'Wells Fargo & Company', sector: 'Financials' },
		{ symbol: 'C', name: 'Citigroup Inc.', sector: 'Financials' },
		{ symbol: 'GS', name: 'The Goldman Sachs Group, Inc.', sector: 'Financials' },
		{ symbol: 'MS', name: 'Morgan Stanley', sector: 'Financials' },
		{ symbol: 'AXP', name: 'American Express Company', sector: 'Financials' },
		{ symbol: 'BLK', name: 'BlackRock, Inc.', sector: 'Financials' },
		{ symbol: 'USB', name: 'U.S. Bancorp', sector: 'Financials' },
		{ symbol: 'PNC', name: 'The PNC Financial Services Group, Inc.', sector: 'Financials' }
	];

	let flavorOptions = stock_symbols.map(stock => ({
		label: `${stock.name} (${stock.symbol})`,
		value: stock.symbol.toLowerCase(), // Convert symbol to lowercase for consistency
		keywords: `${stock.symbol.toLowerCase()}, ${stock.name.toLowerCase()}, ${stock.sector.toLowerCase()}`, // Include symbol and name as keywords
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
	today.setMonth(today.getMonth() - 24); // Subtract six months
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
			loading = true;
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
					<!-- <input class="input w-full mb-2" type="search" name="demo" bind:value={inputDemo} placeholder="Search..." > -->
					<InputChip bind:input={inputChip} bind:value={inputChipList} name="chips" placeholder="Search"/>
					<Autocomplete 
						class="w-full" 
						bind:input={inputChip} 
						options={flavorOptions}
						allowlist={inputChipList} 
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
		{#if loading}
        	<ProgressBar value={undefined} />
    	{/if}
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
				:
				{
					head: ['Dates', '$ Actual', '$ Predicted'],
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
