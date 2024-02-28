<script>
// @ts-nocheck

	import "../app.pcss";
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppShell } from '@skeletonlabs/skeleton';
	import python from '$lib/images/python.svg';
	import github from '$lib/images/github.svg';
	import { computePosition, autoUpdate, offset, shift, flip, arrow } from '@floating-ui/dom';
	import { storePopup } from '@skeletonlabs/skeleton';
	storePopup.set({ computePosition, autoUpdate, offset, shift, flip, arrow });
	import { popup } from '@skeletonlabs/skeleton';

	const popupFeatured = {
		// Represents the type of event that opens/closed the popup
		event: 'click',
		// Matches the data-popup value on your popup element
		target: 'popupFeatured',
		// Defines which side of your trigger the popup will appear
		placement: 'bottom',
	};
			

</script>

<AppShell>
	<svelte:fragment slot="header">
		<div class="title">
			<button style="margin-right: 2vw; max-width: 10vw;" class="btn variant-ghost-success" use:popup={popupFeatured}>Need Help?</button>
			<div class="card p-4 w-72 shadow-xl" data-popup="popupFeatured">
				<p class="mb-2 font-bold">Stock Symbols Lookup</p> 
				<p>Yahoo Finance Canada's lookup tool gives you access to any company's stock symbol to enter into the search bar.</p> 
				<a class="mt-2 btn variant-soft w-full" href="https://ca.finance.yahoo.com/lookup/" target="_blank">Find a Symbol</a>
			</div>
			<h1 class="h1">LSTM ML Prediction model</h1>
			
		</div>
	</svelte:fragment>
		<slot />
	<svelte:fragment slot="footer">
		<div class="footer">
			Visit the Github 
			<a href="https://github.com/ThierryJones21/ml-stock-prediciton" target="_blank">
				<img src={github} alt="SvelteKit" />
			</a>
			and Google Colab for this project
			<a href="https://colab.research.google.com/drive/1ZxWSM0klQ5dlHQtwspzn_skuMLrjyh0y#scrollTo=ZiEESH4HcI-z" target="_blank">
				<img src={python} alt="GitHub" />
			</a>
		</div>
	</svelte:fragment>
</AppShell>

<style>
	.title {
		margin-top: 5vh;
		display: flex;
		justify-content: center;
	}
	.title .h1{
	}
	.light{
		align-items: center;
		/* margin-left: 50vh; */

	}
	 .footer img {
		width: 2em;
		height: 2em;
		object-fit: contain;
	}
	.footer{
		margin-top: 2vh;
		display: flex;
		justify-content: center;
	}

</style>
