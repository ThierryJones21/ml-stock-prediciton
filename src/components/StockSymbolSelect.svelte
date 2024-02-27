<!-- StockSymbolSelect.svelte -->
<script lang="ts">
  import { Autocomplete } from "@skeletonlabs/skeleton";
  import type { AutocompleteOption } from "@skeletonlabs/skeleton";

  export let stockSymbols: any[] = [];
  export let inputChip: string = '';
  export let inputChipList: string[] = ['vanilla', 'chocolate'];

  // Define flavorOptions as an array of AutocompleteOption<string, unknown>
  const flavorOptions: AutocompleteOption<string, unknown>[] = stockSymbols.map(({ symbol, name }) => ({
      value: symbol,
      label: `${symbol} - ${name}`
  }));

  // Function to handle select change
  function handleChange(event: Event) {
      const selectedSymbol = (event.target as HTMLSelectElement).value;
      // Do something with the selected symbol
      console.log('Selected symbol:', selectedSymbol);
  }

  // Function to handle chip selection
  function onInputChipSelect(event: CustomEvent<AutocompleteOption<string, unknown>>) {
      const selectedChip = event.detail.value;
      // Do something with the selected chip
      console.log('Selected chip:', selectedChip);
  }
</script>

<select bind:value={inputChip} on:change={handleChange}>
  {#each stockSymbols as { symbol, name }}
      <option value={symbol}>{symbol} - {name}</option>
  {/each}
</select>

<div class="card w-full max-w-sm max-h-48 p-4 overflow-y-auto" tabindex="-1">
  <!-- Autocomplete component -->
  <Autocomplete
      bind:input={inputChip}
      bind:value={inputChipList}
      options={flavorOptions}
      denylist={inputChipList}
      on:selection={onInputChipSelect}
  />
</div>
