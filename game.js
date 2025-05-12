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
let isTyping = false;
let currentText = "";
let charIndex = 0;
let typingSpeed = 120; // 文字送り速度（ミリ秒）
let skipIndex = -1;
let mouthAnimationInterval = null;
let mouthOpen = false;

// テキストを1文字ずつ表示する関数
function typeText(text) {
    isTyping = true;
    currentText = text;
    charIndex = 0;
    dialogue.textContent = ""; // 初期化
    startMouthAnimation(); // 口パク開始
    typeNextCharacter();
}

// 次の文字を表示する関数
function typeNextCharacter() {
    // 強制表示が実施された場合は終了
    if (!isTyping) return;

    // 文字送り処理
    if (charIndex < currentText.length) {
        dialogue.textContent += currentText[charIndex];
        charIndex++;
        setTimeout(typeNextCharacter, typingSpeed);
    } else {
        isTyping = false;
        stopMouthAnimation(); // 口パク停止
    }
}

// 強制的に全文表示する関数
function forceCompleteText() {
    dialogue.textContent = currentText;
    isTyping = false;
    stopMouthAnimation();
}

// 口パクアニメーションの開始
function startMouthAnimation() {
    if (mouthAnimationInterval) return; // 既に開始されている場合は無視

    const currentImage = character.style.backgroundImage;
    if (currentImage.includes("_closed")) {
        mouthAnimationInterval = setInterval(() => {
            if (mouthOpen) {
                character.style.backgroundImage = currentImage.replace("_open", "_closed");
                mouthOpen = false;
            } else {
                character.style.backgroundImage = currentImage.replace("_closed", "_open");
                mouthOpen = true;
            }
        }, 150); // 口パクの速さ
    }
}

// 口パクアニメーションの停止
function stopMouthAnimation() {
    clearInterval(mouthAnimationInterval);
    mouthAnimationInterval = null;
    
    // 口を閉じた状態に戻す
    const currentImage = character.style.backgroundImage;
    if (currentImage.includes("_open")) {
        character.style.backgroundImage = currentImage.replace("_open", "_closed");
    }
}

// シナリオの進行
function loadNextLine() {
    if (isTyping || isSelecting) return; // 文字送り中や選択肢表示中は無視

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
        choiceContainer.innerHTML = "";
        choiceContainer.style.display = "flex"; // 選択肢を表示

        // 選択肢の追加
        let nextIndex = currentIndex + 1;
        const choices = [];
        let endOfChoices = -1;

        // 選択肢とその終了位置を特定
        while (nextIndex < scenarioData.length) {
            const optionLine = scenarioData[nextIndex].trim();

            if (optionLine.startsWith("1:") || optionLine.startsWith("2:")) {
                const optionText = optionLine.substring(3).trim();
                const optionNumber = optionLine[0];
                choices.push({ number: optionNumber, text: optionText });
                nextIndex++;
            } else {
                endOfChoices = nextIndex;
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
                    const selectLine = scenarioData[targetIndex];
                    const [, fullText] = selectLine.split(" ");
                    
                    // キャラ名とセリフを分離
                    if (fullText.includes("「")) {
                        const [selectName, selectText] = fullText.split("「");
                        characterName.textContent = selectName.trim();
                        currentText = selectText.replace("」", "").trim();
                        typeText(currentText);
                    } else {
                        // キャラ名なしのセリフ（直接表示）
                        characterName.textContent = "";
                        currentText = fullText.trim();
                        typeText(currentText);
                    }

                    // 次の通常セリフに進む位置に設定
                    skipIndex = targetIndex;
                    currentIndex = endOfChoices;
                }
            };

            choiceContainer.appendChild(button);
        });

        // 選択肢ブロックの終了位置に移動
        currentIndex = endOfChoices;
        return;
    }

    // 選択肢セリフはスキップ
    if (line.startsWith("select")) {
        currentIndex++;
        loadNextLine();
        return;
    }

    // 通常のセリフの表示（選択肢の範囲外のみ）
    if (currentIndex !== skipIndex) {
        const [name, text] = line.split("「");
        if (text) {
            characterName.textContent = name.trim();
            currentText = text.replace("」", "").trim();
            typeText(currentText);
        } else {
            // キャラ名なしのセリフ
            characterName.textContent = "";
            currentText = line.trim();
            typeText(currentText);
        }
    }

    currentIndex++;
}

// 初期ロード
loadNextLine();

// クリックで次のセリフへ
textBox.addEventListener("click", () => {
    if (isTyping) {
        forceCompleteText();
    } else if (!isSelecting) {
        loadNextLine();
    }
});

// BGMの制御
function toggleBGM() {
    const bgm = document.getElementById("bgm");
    const bgmButton = document.getElementById("bgm-button");

    if (bgm.paused) {
        bgm.play();
        bgmButton.textContent = "🔊";  // 再生中
    } else {
        bgm.pause();
        bgmButton.textContent = "🔈";  // ミュート
    }
}

// 音量調整
function adjustVolume(value) {
    const bgm = document.getElementById("bgm");
    const volume = value / 100;
    bgm.volume = volume;
}

// ページ読み込み時にBGMを自動再生
window.addEventListener("load", () => {
    const bgm = document.getElementById("bgm");
    const bgmButton = document.getElementById("bgm-button");
    const volumeSlider = document.getElementById("volume-slider");

    // 初期音量
    bgm.volume = 0.5;
    volumeSlider.value = 50;

    // 自動再生（ユーザー操作が必要な場合あり）
    try {
        bgm.play();
        bgmButton.textContent = "🔊";
    } catch (e) {
        bgmButton.textContent = "🔈"; // 自動再生がブロックされた場合
    }
});
