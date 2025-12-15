async function apiPatchMetadata(payload) {
    const response = await fetch('https://depositphotos.com/files/update', {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(payload)
    });
    if (!response.ok) throw new Error("API Error: " + response.status);
    return await response.json();
}

async function apiAttachRelease(fileId, release, dicts) {
    const gender = dicts.modelGender[release.gender] || 'male';
    const ethnicity = dicts.modelEthnicity[release.modelEthnicity] || 'caucasian';
    const age = (release.modelBirthdate) ? (new Date().getFullYear() - new Date(release.modelBirthdate).getFullYear() < 18 ? 'child' : 'adult') : 'adult';

    const params = new URLSearchParams();
    params.append('handler', 'ajaxAttachReleaseToItemInfo');
    params.append('fileItemId', fileId);
    if (release.filename) {
        params.append('filename', release.filename);
    }
    params.append('model_gender', gender);
    params.append('model_age', age);
    params.append('ethnicity', ethnicity);

    const response = await fetch('https://depositphotos.com/api.html', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: params
    });
    if (!response.ok) throw new Error("Failed to attach release: " + response.status);
}

async function submitDepositPhotosFiles(assets, dicts) {
    for (const asset of assets) {
        try {
            // Fill metadata
            const metadata = {
                keywords: asset.metadata.keywords,
                description: asset.metadata.description || asset.metadata.title,
                nudity: 'no',
                editorial: 'no'
            };
            await apiPatchMetadata(metadata);

            // Attach releases
            if (asset.metadata.releases) {
                for (const release of asset.metadata.releases) {
                    await apiAttachRelease(asset.id, release, dicts);
                }
            }

            // Submit file
            asset.submit();
        } catch (error) {
            asset.markFailed(error.message);
        }
    }
}