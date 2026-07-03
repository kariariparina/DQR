async function loadDataset() {

    let dataset = [];

    for (let i = 0; i < 256; i++) {

        const hex = i.toString(16).padStart(2, "0");

        try {

            const response = await fetch(`rsids/${hex}.txt`);

            if (!response.ok) {
                console.error(`${hex}.txt が見つかりません`);
                continue;
            }

            const text = await response.text();

            text.split(/\r?\n/).forEach(line => {
                line = line.trim();
                if (line !== "") {
                    dataset.push(line);
                }
            });

        } catch (e) {
            console.error(e);
        }
    }

    console.log("読み込み完了:", dataset.length);

    return dataset;
}
