<script>
// @ts-nocheck
	import { stock_symbols } from '$lib/stock-data.js';
	import { Autocomplete } from '@skeletonlabs/skeleton';

	
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


	let loading = false;
	let symbol = ''; // Default stock symbol
	let today = new Date();
	today.setMonth(today.getMonth() - 24); // Subtract six months
  	let start_date = today.toISOString().split('T')[0];
	let today_2 = new Date();
	today_2.setDate(today_2.getDate() - 1); // Subtract one day
	let end_date = today_2.toISOString().split('T')[0]; 	
	let future_days = 7; // Default number of future days to predict

	let today_new = new Date();
    let tenYearsAgo = new Date();
    tenYearsAgo.setFullYear(today_new.getFullYear() - 10);

    $: minStartDate = formatDate(tenYearsAgo);
    $: maxStartDate = formatDate(today_new);
    $: minEndDate = minStartDate;
    $: maxEndDate = maxStartDate;

    function formatDate(date) {
        let yyyy = date.getFullYear();
        let mm = String(date.getMonth() + 1).padStart(2, '0');
        let dd = String(date.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    }

	function onFlavorSelection(event) {
		symbol = event.detail.value.toUpperCase();
	}



	async function sendData(symbol, start_date, end_date, future_days) {
		try {
			// Your data sending logic goes here
			const url = '/home'
			localStorage.setItem('symbol', symbol);
			localStorage.setItem('start_date', start_date);
			localStorage.setItem('end_date', end_date);
			localStorage.setItem('future_days', future_days);

			window.location.href = url; // Redirect to the new page
		} catch (error) {
			console.error('Error sending form data:', error);
		} finally {
			loading = false;
		}
	}



</script>
  
<section>
	<div class="main-content">
		<div class="input-container">
			<label for="symbol">Stock Symbol:</label>
			<input type="text" id="symbol" bind:value={symbol} placeholder=" Select/Enter Stock">

		</div>			
		<div class="input-container">
            <label for="selectedSector">Sector:</label>
			<div class="card width:main-content py-2 px-0.5">
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
		<div class="input-container" >  
			<label for="selectedSector">Select:</label>
			<div class="card w-full max-h-48 p-4 overflow-y-auto" style="justify-content: center;">
				<div class="flex flex-col  w-full"> 
					<input class="input w-full mb-2" type="search" name="demo" bind:value={inputChip} placeholder=" Search..." >
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
			<input type="date" id="start_date" bind:value={start_date} min={minStartDate} max={maxStartDate}>
		</div>
		<div class="input-container">
			<label for="end_date">End Date:</label>
			<input type="date" id="end_date" bind:value={end_date} min={minEndDate} max={maxEndDate}>
		</div>
		<div class="input-container">
			<button class="btn btn-filled-primary" 
					style="color: white;" 
					disabled={!(symbol && start_date && end_date && future_days)} 
					on:click={() => sendData(symbol, start_date, end_date, future_days)}>
				Predict Stock Price
			</button>
		</div>
	</div>
	<div class="sidebarRight">
		<div>
			<h4 class="h3 font-bold mb-2">Project Overview:</h4> 
			<p >Are you tired of uncertain stock market outcomes? Do you wish you could foresee stock price movements with greater accuracy? 
				Introducing my latest project TomorrowTrend, a predictive stock price application that leverages advanced machine learning techniques to forecast stock 
				prices and empower investors with valuable insights.</p> 
			<h5 class="h5 font-bold mt-4 mb-2">How it works:</h5>
			<p>TomorrowTrend fetches real-time stock data from 
				<a class="font-semibold" href="https://site.financialmodelingprep.com/developer/docs" target="_blank">financialmodelingprep.com</a> 
				API and preprocesses it for analysis, ensuring accuracy and reliability.</p>

			<h5 class="h5 font-bold mt-4 mb-2">Prediction Generation:</h5>
			<p>Leveraging a trained (LSTM) Long Short Term Memory machine learning model, TomorrowTrend generates precise predictions for future stock prices based on historical data and user inputs.</p>

			<h5 class="h5 font-bold mt-4 mb-2">Visual Insights:</h5>
			<p>Visualize predicted future prices alongside historical data using TomorrowTrend's interactive line charts, and tables gaining valuable insights into market trends and potential outcomes.</p>
		
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
	.main-content{
		padding: 10px;
		margin-left: 3vw;
		margin-right: 5vw;
	}

	.input-container {
		padding: 10px 0; 
		display: flex;
		align-items: center;
	}

	label {
		width: 75px; /* Adjust the width of the labels as needed */
		padding-right: 10px; /* Adjust the spacing between label and input/select */
	}

	input, button {
		width: auto; /* Ensure button size matches text size */
		min-width: 8ch; 
		flex: 1;
	}

	.main-content {
		flex: 0.5; /* The other two columns will equally share the available space */
	}
	.sidebarRight{
		flex: 0.5;
		margin-right: 3vw;
		padding: 10px;

	}
	@media (max-width: 767px) {
    section {
        flex-direction: column; /* Stack content on smaller screens */
        align-items: center; /* Center content horizontally */
    }

    .main-content, .sidebarRight {
        flex: 1; /* Take full width on smaller screens */
        margin: 0; /* Remove margin to center content */
    }

    .input-container {
        width: 90%; /* Adjust width for better fit on smaller screens */
    }

    label {
        width: auto; /* Adjust width to fit content */
        padding-right: 0; /* Remove padding for better alignment */
    }
}

</style>
