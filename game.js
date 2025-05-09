// HTML要素の取得
const background = document.getElementById("background");
const character = document.getElementById("character");
const textBox = document.getElementById("text-box");
const characterName = document.getElementById("character-name");
const dialogue = document.getElementById("dialogue");
const choiceContainer = document.getElementById("choice-container");

// シナリオの初期設定
let currentIndex = 0;
let isSelecting = false;
let inChoiceBranch = false;

// シナリオの進行
function loadNextLine() {
    if (currentIndex >= scenarioData.length) {
        console.log("シナリオ終了");
        return;
    }

    const line = scenarioData[currentIndex].trim();

    // 背景画像の設定
    if (line.startsWith("set bg")) {
        const bgFile = line.split(" ")[1];
        background.style.backgroundImage = `url(assets/${bgFile})`;
        currentIndex++;
        loadNextLine(); // 自動で次の行へ
        return;
    }

    // キャラクター画像の設定
    if (line.startsWith("set char")) {
        const charFile = line.split(" ")[1];
        character.style.backgroundImage = `url(assets/${charFile})`;
        character.style.display = "block";
        currentIndex++;
        loadNextLine(); // 自動で次の行へ
        return;
    }

    // 選択肢の設定
    if (line === "set select") {
        isSelecting = true;
        inChoiceBranch = true;
        choiceContainer.innerHTML = "";
        choiceContainer.style.display = "flex"; // 選択肢を表示

        // 選択肢の追加
        let nextIndex = currentIndex + 1;
        const choices = [];

        // 選択肢をすべて収集
        while (nextIndex < scenarioData.length) {
            const optionLine = scenarioData[nextIndex].trim();
            if (optionLine.startsWith("1:") || optionLine.startsWith("2:")) {
                const optionText = optionLine.substring(3).trim();
                const optionNumber = optionLine[0];
                choices.push({ number: optionNumber, text: optionText });
                nextIndex++;
            } else {
                break;
            }
        }

        // 選択肢ボタンの生成
        choices.forEach(choice => {
            const button = document.createElement("button");
            button.textContent = choice.text;
            button.classList.add("choice-button");

            // 選択肢のクリックイベント
            button.onclick = () => {
                choiceContainer.style.display = "none";
                isSelecting = false;

                // 対応する選択肢のセリフを表示
                const targetIndex = scenarioData.findIndex(line => line.startsWith(`select${choice.number} `));
                if (targetIndex !== -1) {
                    // セリフ表示
                    const selectLine = scenarioData[targetIndex];
                    const [selectName, ...selectTextArray] = selectLine.split(" ");
                    characterName.textContent = selectName.replace(`select${choice.number}`, "").trim();
                    dialogue.textContent = selectTextArray.join(" ").trim();

                    // 次の通常セリフに進む位置に設定
                    currentIndex = targetIndex + 1;
                    inChoiceBranch = false;
                }
            };

            choiceContainer.appendChild(button);
        });

        // 選択肢ブロックの終了位置に移動
        currentIndex = nextIndex;
        return;
    }

    // 選択肢のセリフはスキップ
    if (line.startsWith("select")) {
        currentIndex++;
        loadNextLine();
        return;
    }

    // 通常のセリフの表示（選択肢の範囲外のみ）
    if (!inChoiceBranch) {
        const [name, text] = line.split("「");
        if (text) {
            characterName.textContent = name.trim();
            dialogue.textContent = text.replace("」", "").trim();
        }
        currentIndex++;
    }
}

// 初期ロード
loadNextLine();

// クリックで次のセリフへ
textBox.addEventListener("click", () => {
    if (!isSelecting) {
        loadNextLine();
    }
});
