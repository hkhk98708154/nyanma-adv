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
let typingSpeed = 60;
let mouthAnimationInterval = null;
let mouthOpen = false;
let currentCharacterImage = "";

// 画像プリロード関数
function preloadImages(images) {
    return Promise.all(
        images.map(src => {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.src = src;
                img.onload = () => resolve(src);
                img.onerror = reject;
            });
        })
    );
}

// 使用する画像リストを収集
function collectAllImagePaths() {
    const imagePaths = new Set();

    scenarioData.forEach(line => {
        if (line.startsWith("set bg")) {
            const bgFile = line.split(" ")[1];
            imagePaths.add(`assets/${bgFile}`);
        }
        if (line.startsWith("set char")) {
            const charFile = line.split(" ")[1];
            imagePaths.add(`assets/${charFile}`);
            // 口パク対応のペア画像も追加
            if (charFile.includes("_closed")) {
                imagePaths.add(`assets/${charFile.replace("_closed", "_open")}`);
            }
        }
    });

    return Array.from(imagePaths);
}

// ゲーム開始前にプリロード
window.addEventListener("load", async () => {
    const imagePaths = collectAllImagePaths();

    try {
        await preloadImages(imagePaths);
        console.log("全画像のプリロードが完了しました。");
    } catch (error) {
        console.error("画像のプリロードに失敗しました:", error);
    }
});

// テキストを1文字ずつ表示する関数
function typeText(text) {
    isTyping = true;
    currentText = text;
    charIndex = 0;
    dialogue.textContent = "";
    startMouthAnimation();
    typeNextCharacter();
}

// 次の文字を表示する関数
function typeNextCharacter() {
    if (!isTyping) return;

    if (charIndex < currentText.length) {
        dialogue.textContent += currentText[charIndex];
        charIndex++;
        setTimeout(typeNextCharacter, typingSpeed);
    } else {
        isTyping = false;
        stopMouthAnimation();
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
    if (mouthAnimationInterval) return;

    if (currentCharacterImage.includes("_closed")) {
        mouthAnimationInterval = setInterval(() => {
            if (mouthOpen) {
                character.style.backgroundImage = `url(assets/${currentCharacterImage})`;
                mouthOpen = false;
            } else {
                const openImage = currentCharacterImage.replace("_closed", "_open");
                character.style.backgroundImage = `url(assets/${openImage})`;
                mouthOpen = true;
            }
        }, 150);
    }
}

// 口パクアニメーションの停止
function stopMouthAnimation() {
    clearInterval(mouthAnimationInterval);
    mouthAnimationInterval = null;

    if (currentCharacterImage.includes("_closed")) {
        character.style.backgroundImage = `url(assets/${currentCharacterImage})`;
    }
}

// ゲーム開始
function startGame() {
    const titleScreen = document.getElementById("title-screen");
    const gameContainer = document.getElementById("game-container");
    const endScreen = document.getElementById("end-screen");
    titleScreen.style.display = "none";
    gameContainer.style.display = "block";
    endScreen.style.display = "none";

    // BGMの再生
    const bgm = document.getElementById("bgm");
    try {
        bgm.play();
        document.getElementById("bgm-button").textContent = "🔊";
    } catch (e) {
        console.log("自動再生がブロックされました");
    }

    // シナリオの初期化
    currentIndex = 0;
    isTyping = false;
    isSelecting = false;
    currentCharacterImage = "";  // キャラ画像の初期化

    // 最初のシナリオを強制的にロード
    loadNextLine();
}

// ゲーム終了
function endGame() {
    const gameContainer = document.getElementById("game-container");
    const endScreen = document.getElementById("end-screen");
    gameContainer.style.display = "none";
    endScreen.style.display = "flex";

    // BGMを停止
    const bgm = document.getElementById("bgm");
    bgm.pause();
    bgm.currentTime = 0;
}

// タイトルに戻る
function restartGame() {
    const titleScreen = document.getElementById("title-screen");
    const endScreen = document.getElementById("end-screen");
    titleScreen.style.display = "flex";
    endScreen.style.display = "none";
}

// シナリオの進行
function loadNextLine() {
    if (isTyping || isSelecting) return;

    if (currentIndex >= scenarioData.length) {
        endGame();
        return;
    }

    const line = scenarioData[currentIndex].trim();

    // 背景画像の設定
    if (line.startsWith("set bg")) {
        const bgFile = line.split(" ")[1];
        background.style.backgroundImage = `url(assets/${bgFile})`;
        currentIndex++;
        loadNextLine();
        return;
    }

    // キャラクター画像の設定
    if (line.startsWith("set char")) {
        const charFile = line.split(" ")[1];
        currentCharacterImage = charFile;
        character.style.backgroundImage = `url(assets/${charFile})`;
        character.style.display = "block";

        if (isTyping) {
            startMouthAnimation();
        }

        currentIndex++;
        loadNextLine();
        return;
    }

    // **選択肢の設定**
    if (line === "set select") {
        isSelecting = true;
        choiceContainer.innerHTML = "";
        choiceContainer.style.display = "flex";

        let nextIndex = currentIndex + 1;
        const choices = [];
        const choiceMap = {};

        // **選択肢の取得**
        while (nextIndex < scenarioData.length) {
            const optionLine = scenarioData[nextIndex].trim();

            // **選択肢ブロックの終了を検出**
            if (optionLine.startsWith("set ") || optionLine === "set select") break;
            
            // **選択肢オプション**
            if (optionLine.match(/^\d:/)) {
                const [optionNumber, optionText] = optionLine.split(": ");
                choices.push({ number: optionNumber.trim(), text: optionText.trim() });
            }

            // **選択肢のターゲットセリフを取得**
            if (optionLine.startsWith("select")) {
                const [selectLabel, fullText] = optionLine.split(" ", 2);
                choiceMap[selectLabel.trim()] = fullText.trim();
            }

            nextIndex++;
        }

        // **選択肢ボタンの生成**
        choices.forEach(choice => {
            const button = document.createElement("button");
            button.textContent = choice.text;
            button.classList.add("choice-button");

            button.onclick = () => {
                choiceContainer.style.display = "none";
                isSelecting = false;

                // **選択肢に対応するセリフを表示**
                const selectLabel = `select${choice.number}`;
                const fullText = choiceMap[selectLabel];
                
                if (fullText) {
                    const [selectName, selectText] = fullText.split("「");
                    if (selectText) {
                        characterName.textContent = selectName.trim();
                        typeText(selectText.replace("」", "").trim());
                    } else {
                        characterName.textContent = "";
                        typeText(fullText.trim());
                    }
                }

                // **選択肢ブロック終了後に進む**
                currentIndex = nextIndex;
                loadNextLine();
            };

            choiceContainer.appendChild(button);
        });

        // **現在の選択肢ブロックの終了位置を設定**
        currentIndex = nextIndex;
        return;
    }

    // **通常のセリフの表示**
    if (!line.startsWith("select")) {
        const [name, text] = line.split("「");
        if (text) {
            characterName.textContent = name.trim();
            typeText(text.replace("」", "").trim());
        } else {
            characterName.textContent = "";
            typeText(line.trim());
        }
    }

    currentIndex++;
}

// **初期ロード**
loadNextLine();

// **クリックで次のセリフへ**
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