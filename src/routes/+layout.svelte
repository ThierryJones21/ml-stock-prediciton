<script>
	import "../app.pcss";
	import { LightSwitch } from '@skeletonlabs/skeleton';
	import { AppShell } from '@skeletonlabs/skeleton';
	import python from '$lib/images/python.svg';
	import github from '$lib/images/github.svg';

</script>

<AppShell>
	<svelte:fragment slot="header">
		<div class="title">
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
