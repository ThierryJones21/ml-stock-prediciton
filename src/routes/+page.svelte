<script>
// @ts-nocheck

	// import { chart } from "svelte-apexcharts";
	import Chart from 'chart.js/auto';
	import { onMount } from 'svelte';
	import * as tf from '@tensorflow/tfjs';
	import { getStockData } from '$lib/stock-api'; 
	const modelPath = '/tensorflow/model_v3/model.json';
	import { stock_symbols } from '$lib/stock-data.js';
	import { Table, Autocomplete, ProgressBar } from '@skeletonlabs/skeleton';

	
	let chartInstance;
	let inputChip = '';
	let selectedSector = "all"; 

	let flavorOptions = stock_symbols.map(stock => ({
		label: `${stock.name} (${stock.symbol})`,
		value: stock.symbol.toLowerCase(), // Convert symbol to lowercase for consistency
		keywords: `${stock.symbol.toLowerCase()}, ${stock.name.toLowerCase()}, ${stock.sector.toLowerCase()}`, 
		meta: { company: stock.name }
	}));

	$: filteredFlavorOptions = selectedSector === "all" 
        ? flavorOptions 
        : flavorOptions.filter(option => {
            const keywords = option.keywords.toLowerCase();
            return keywords.includes(selectedSector.toLowerCase());
        });


	let model;
	let loading = false;
	let symbol = ''; // Default stock symbol
	let today = new Date();
	today.setMonth(today.getMonth() - 24); // Subtract six months
  	let start_date = today.toISOString().split('T')[0];
	let today_2 = new Date();
	today_2.setDate(today_2.getDate() - 1); // Subtract one day
	let end_date = today_2.toISOString().split('T')[0]; 	
	let future_days = 7; // Default number of future days to predict
	let data = [];
	let futureData = [];
	let tableData =[];
  
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
			let stock_data = await getStockData(symbol, start_date, end_date);

			console.log("stock data directly from API:", stock_data)

			// Preprocess data
			tableData = {...stock_data['historical'][0]};
			delete tableData.label;

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
				// const actual = y_actual[idx];
				const actual = stock_data['historical'].map(price => price.close)[idx]
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
			dates: dates,
		}
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
	<div class="sidebar-left" style="max-height: 75vh; overflow-y: auto;">
		<div class="input-container">
			<label for="symbol">Stock Symbol:</label>
			<input type="text" id="symbol" bind:value={symbol} placeholder="Select a Stock/Enter your own">
		</div>
		<div class="input-container">
            <label for="selectedSector">Sector:</label>
			<div class="card w-full py-2 px-0.5">
				<div class="col-span-4 flex flex-wrap justify-center gap-4">
					<button style="max-width: 5vw;" class="btn {selectedSector === 'all' ? 'bg-gradient-to-br variant-gradient-primary-secondary' : 'variant-ghost-surface '}" on:click={() => selectedSector = 'all'}>All</button>
					<button style="max-width: 5vw;" class="btn {selectedSector === 'tech' ? 'variant-filled-primary' : 'variant-ghost-surface '}" on:click={() => selectedSector = 'tech'}>Tech</button>
					<button style="max-width: 5vw;" class="btn {selectedSector === 'food' ? 'variant-filled-primary' : 'variant-ghost-surface '}" on:click={() => selectedSector = 'food'}>Food</button>
					<button style="max-width: 5vw;" class="btn {selectedSector === 'energy' ? 'variant-filled-primary' : 'variant-ghost-surface '}" on:click={() => selectedSector = 'energy'}>Energy</button>
					<button style="max-width: 5vw;" class="btn {selectedSector === 'utilities' ? 'variant-filled-primary' : 'variant-ghost-surface '}" on:click={() => selectedSector = 'utilities'}>Utilities</button>
					<button style="max-width: 5vw;" class="btn {selectedSector === 'healthcare' ? 'variant-filled-primary' : 'variant-ghost-surface '}" on:click={() => selectedSector = 'healthcare'}>Health</button>
					<button style="max-width: 5vw;" class="btn {selectedSector === 'financials' ? 'variant-filled-primary' : 'variant-ghost-surface '}" on:click={() => selectedSector = 'financials'}>Finance</button>
				</div>
			</div>		  
        </div>
		<div class="input-container">
			<label for="symbol">Select Stock:</label>
			<!-- Replace the input/select with the Autocomplete component -->
			<div class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto">
				<div class="flex flex-col  w-full"> <!-- Container for stacking elements -->
					<input class="input w-full mb-2" type="search" name="demo" bind:value={inputChip} placeholder="Search..." >
					<Autocomplete 
						class="w-full" 
						bind:input={inputChip} 
						options={filteredFlavorOptions}
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
			<button class="btn btn-filled-primary" style="color: white;"on:click={() => predict(symbol, start_date, end_date, future_days)}>Predict Stock Price</button>
		</div>
	</div>
	
	
	<div class="main-content">
		<div style="max-width: 45vw; overflow-x: auto;">
			<canvas id="myChart"></canvas>
			{#if loading}
				<ProgressBar value={undefined} />
			{/if}
			{#if data.length > 1}
			<div style="margin-top: 1vw; justify-content: center;">
				<!-- <h2 class="h1 "style="margin-bottom: 1vw;">{symbol.toUpperCase()}</h2> -->
				<Table
					source={{
						head: Object.keys(tableData).map(key => key.toString()),
						body: [Object.values(tableData).map(value => value.toString())]
					}}
				/>
			</div>
			{/if}
		</div>
	</div>
		
	<div class="right-content">
		<div style="max-height: 75vh; overflow-y: auto;">
			{#if data.length > 1}
			<Table
				source={
					data.length > 1 ? // Check if data is not empty
					{
						head: ['Dates', '$ Actual', '$ Predicted'],
						body: [
							...futureData.map(({ date, predictedPrice }) => {
								return [
									date,
									`<span>N/A</span>`,
									`<span style="color: red; font-weight: bold;">${predictedPrice}</span>`
								];
							}),
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
			{/if}
		</div>
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
