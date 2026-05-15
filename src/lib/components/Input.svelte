<script lang="ts">
	const {
		label,
		type,
		field,
		oninput = () => {
			console.log('NO ONINPUT');
		},
		placeholder = ''
	} = $props();
</script>

<label class="input">
	<span class="label">{label}:</span>
	<input {...field.as(type)} {placeholder} {oninput} />
</label>
{#each field.issues() as issue, i (i)}
	<p class="issue">{issue.message}</p>
{/each}
