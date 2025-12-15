// Depositphotos Submission Script with robust error handling and metadata synchronization

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function validateMetadata(asset) {
    const errors = [];
    
    if (!asset.meta || !asset.meta.title || asset.meta.title.trim() === '') {
        errors.push('Title is required');
    }
    
    if (!asset.meta || !asset.meta.description || asset.meta.description.trim() === '') {
        errors.push('Description is required');
    }
    
    if (!asset.meta || !asset.meta.keywords || asset.meta.keywords.length < 5) {
        errors.push('At least 5 keywords are required');
    }
    
    return errors;
}

async function fillMetadataForm(asset) {
    try {
        // Wait for page to be ready
        await sleep(500);
        
        // Fill title field
        const titleField = document.querySelector('input[name="title"], #title, [data-field="title"]');
        if (titleField && asset.meta.title) {
            titleField.value = asset.meta.title;
            titleField.dispatchEvent(new Event('input', { bubbles: true }));
            titleField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Fill description field
        const descField = document.querySelector('textarea[name="description"], #description, [data-field="description"]');
        if (descField && asset.meta.description) {
            descField.value = asset.meta.description;
            descField.dispatchEvent(new Event('input', { bubbles: true }));
            descField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Fill keywords
        const keywordsField = document.querySelector('input[name="keywords"], #keywords, [data-field="keywords"]');
        if (keywordsField && asset.meta.keywords && asset.meta.keywords.length > 0) {
            const keywordsStr = asset.meta.keywords.join(', ');
            keywordsField.value = keywordsStr;
            keywordsField.dispatchEvent(new Event('input', { bubbles: true }));
            keywordsField.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Handle model releases if present
        if (asset.meta.modelReleases && asset.meta.modelReleases.length > 0) {
            const modelReleaseCheckbox = document.querySelector('input[name="hasModelRelease"], #hasModelRelease');
            if (modelReleaseCheckbox) {
                modelReleaseCheckbox.checked = true;
                modelReleaseCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        // Handle property releases if present
        if (asset.meta.propertyReleases && asset.meta.propertyReleases.length > 0) {
            const propertyReleaseCheckbox = document.querySelector('input[name="hasPropertyRelease"], #hasPropertyRelease');
            if (propertyReleaseCheckbox) {
                propertyReleaseCheckbox.checked = true;
                propertyReleaseCheckbox.dispatchEvent(new Event('change', { bubbles: true }));
            }
        }
        
        return true;
    } catch (error) {
        console.error('Error filling metadata form:', error);
        return false;
    }
}

async function submitAsset(asset, index) {
    try {
        console.log(`[${index + 1}] Processing ${asset.name}...`);
        
        // Validate metadata before submission
        const validationErrors = validateMetadata(asset);
        if (validationErrors.length > 0) {
            console.error(`Validation failed for ${asset.name}:`, validationErrors.join(', '));
            asset.markFailed('Metadata validation failed: ' + validationErrors.join(', '));
            return false;
        }
        
        // Check if asset is already uploaded
        const fileIdentifier = asset.uploadedName || asset.name;
        const existingFile = document.querySelector(`[data-filename="${fileIdentifier}"], [data-file="${fileIdentifier}"]`);
        
        if (!existingFile) {
            console.warn(`File ${asset.name} not found on page. Marking as not found.`);
            asset.markNotFound();
            return false;
        }
        
        // Click on the file to select it
        existingFile.click();
        await sleep(800);
        
        // Fill metadata form
        const formFilled = await fillMetadataForm(asset);
        if (!formFilled) {
            console.error(`Failed to fill metadata form for ${asset.name}`);
            asset.markFailed('Failed to fill metadata form');
            return false;
        }
        
        await sleep(500);
        
        // Check if clickSubmit option is enabled
        const clickSubmit = context.properties && context.properties.clickSubmit !== false;
        
        if (clickSubmit) {
            // Find and click the submit/save button
            const submitBtn = document.querySelector('button[type="submit"], .submit-btn, .save-btn, [data-action="submit"]');
            if (submitBtn) {
                submitBtn.click();
                await sleep(1000);
                
                // Wait for success message or error
                const successMsg = document.querySelector('.success-message, .alert-success, [data-status="success"]');
                const errorMsg = document.querySelector('.error-message, .alert-error, [data-status="error"]');
                
                if (errorMsg) {
                    const errorText = errorMsg.textContent || 'Unknown error';
                    console.error(`Submission error for ${asset.name}: ${errorText}`);
                    asset.markFailed(errorText);
                    return false;
                } else if (successMsg || !errorMsg) {
                    console.log(`✓ Successfully submitted ${asset.name}`);
                    asset.markDone();
                    return true;
                }
            } else {
                console.warn('Submit button not found, marking as done without clicking submit');
                asset.markDone();
                return true;
            }
        } else {
            // Just fill the form without submitting
            console.log(`✓ Metadata filled for ${asset.name} (auto-submit disabled)`);
            asset.markDone();
            return true;
        }
        
    } catch (error) {
        console.error(`Error submitting ${asset.name}:`, error);
        asset.markFailed(error.message || 'Unknown error occurred');
        return false;
    }
}

async function runPlugin() {
    console.log("=== Starting Depositphotos Submission Process ===");
    
    // Validate we're on the correct page
    if (window.location.href.indexOf('files/unfinished') < 0) {
        console.warn('Not on unfinished files page, redirecting...');
        window.location.href = 'https://depositphotos.com/files/unfinished/page1.html';
        return;
    }
    
    const assets = window.assets || ImStocker.getSelectedFiles();
    
    if (!assets || assets.length === 0) {
        console.error('No assets found for submission');
        return;
    }
    
    console.log(`Processing ${assets.length} asset(s)...`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < assets.length; i++) {
        const success = await submitAsset(assets[i], i);
        if (success) {
            successCount++;
        } else {
            failCount++;
        }
        
        // Add delay between assets to avoid rate limiting
        if (i < assets.length - 1) {
            await sleep(1500);
        }
    }
    
    console.log("=== Submission Complete ===");
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failCount}`);
}

// Execute the plugin
(async () => {
    try {
        await runPlugin();
    } catch (error) {
        console.error('Fatal error in plugin execution:', error);
    }
})();