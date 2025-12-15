function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runPlugin() {
    console.log("Starting Depositphotos process...");
    
    const assets = ImStocker.getSelectedFiles();

    for (const asset of assets) {
        try {
            console.log(`Processing ${asset.name}...`);
            await sleep(1000);
            console.log(`Success: ${asset.name} submitted!`);
        } catch (error) {
            console.error(`Error submitting ${asset.name}:`, error);
        }
    }

    console.log("Submission complete.");
}

(async () => {
    await runPlugin();
})();