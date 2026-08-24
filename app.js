// --- ESTADO GLOBAL DO JOGADOR ---
let playerState = {
    name: "Jogador",
    level: 1,
    xp: 0,
    nextLevelXp: 100,
    gold: 0,
    skillPoints: 0,
    skills: []
};

// --- DADOS DA MASMORRA E INIMIGOS ---
const enemyPool = [
    { name: "Bug de Sintaxe", hp: 40, xp: 25, gold: 15, icon: "👾" },
    { name: "Erro 404", hp: 60, xp: 35, gold: 25, icon: "👻" },
    { name: "Memory Leak", hp: 80, xp: 50, gold: 40, icon: "🐉" }
];

const bossData = { name: "O Grande Refatorador", hp: 200, xp: 150, gold: 100, icon: "🗿", isBoss: true };

let currentEnemy = enemyPool[0];
let enemyHpMax = currentEnemy.hp;
let enemyCurrentHp = currentEnemy.hp;

// --- DICAS E NPC GUIA ---
const npcTips = [
    "💡 Dica: Suba para o Nível 5 na Masmorra para encarar o Chefão!",
    "📜 Visite o Quadro de Quests para acessar meus projetos reais.",
    "💻 Desbloqueie 'Mago do DOM' na Árvore de Skills para causar mais dano!",
    "📦 Ganhe Gold enfrentando inimigos para usar na loja."
];
let tipIndex = 0;

// --- PERSISTÊNCIA DE DADOS ---
function loadProgress() {
    try {
        const saved = localStorage.getItem("rpg_player_data");
        if (saved) {
            const parsed = JSON.parse(saved);
            playerState = { ...playerState, ...parsed };
            if (!Array.isArray(playerState.skills)) playerState.skills = [];
        }
    } catch (e) {
        console.error("Erro ao carregar save:", e);
    }
    updateHUD();
    renderSkills();
}

function saveProgress() {
    localStorage.setItem("rpg_player_data", JSON.stringify(playerState));
}

// --- ATUALIZAÇÃO DE INTERFACE ---
function updateHUD() {
    const levelElem = document.getElementById("playerLevel");
    if (levelElem) levelElem.innerText = playerState.level;

    const barElem = document.getElementById("xpProgress");
    if (barElem) {
        const percentage = Math.min(100, (playerState.xp / playerState.nextLevelXp) * 100);
        barElem.style.width = percentage + "%";
    }
    
    const skillPointsElem = document.getElementById("skillPoints");
    if (skillPointsElem) skillPointsElem.innerText = playerState.skillPoints;
}

// --- SISTEMA DE XP E NIVELAMENTO ---
function addXp(amount) {
    playerState.xp += amount;

    while (playerState.xp >= playerState.nextLevelXp) {
        playerState.xp -= playerState.nextLevelXp;
        playerState.level += 1;
        playerState.skillPoints += 1;
        playerState.nextLevelXp = Math.floor(playerState.nextLevelXp * 1.5);
        
        unlockAchievement("Level Up!", `Alcançou o Nível ${playerState.level}`, "⚡");
    }

    updateHUD();
    saveProgress();
}

// --- CONQUISTAS ---
function unlockAchievement(title, desc, icon = "🏆") {
    const toast = document.getElementById("achievementToast");
    if (!toast) return;

    document.getElementById("achieveIcon").innerText = icon;
    document.getElementById("achieveTitle").innerText = title;
    document.getElementById("achieveDesc").innerText = desc;

    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
}

// --- HABILIDADES ---
function unlockSkill(id, name) {
    if (playerState.skills.includes(id)) {
        alert("Habilidade já desbloqueada!");
        return;
    }

    if (playerState.skillPoints > 0) {
        playerState.skillPoints -= 1;
        playerState.skills.push(id);
        
        renderSkills();
        updateHUD();
        saveProgress();
    } else {
        alert("Você precisa de Pontos de Habilidade!");
    }
}

function renderSkills() {
    if (!playerState.skills) return;
    playerState.skills.forEach(skillId => {
        const node = document.getElementById(`skill-${skillId}`);
        if (node) {
            node.classList.remove("locked");
            node.classList.add("unlocked");
        }
    });
}

// --- MASMORRA E COMBATE ---
function switchZone(type) {
    if (type === 'boss') {
        if (playerState.level < 5) {
            alert("🔒 O Chefão exige Nível 5 para ser desafiado!");
            return;
        }
        currentEnemy = { ...bossData };
        document.getElementById("enemyCard")?.classList.add("boss-mode");
    } else {
        currentEnemy = { ...enemyPool[Math.floor(Math.random() * enemyPool.length)] };
        document.getElementById("enemyCard")?.classList.remove("boss-mode");
    }

    enemyHpMax = currentEnemy.hp;
    enemyCurrentHp = currentEnemy.hp;

    document.getElementById("enemyName").innerText = currentEnemy.name;
    document.getElementById("enemyIcon").innerText = currentEnemy.icon;
    document.getElementById("enemyHp").style.width = "100%";
    document.getElementById("combatLog").innerText = `Combate iniciado contra: ${currentEnemy.name}!`;
}

function attackEnemy(type) {
    if (enemyCurrentHp <= 0) return;

    let damage = type === 'code' ? 15 : 25;
    if (playerState.skills && playerState.skills.includes('js')) damage += 10;

    enemyCurrentHp = Math.max(0, enemyCurrentHp - damage);

    spawnDamageNumber(damage);

    const enemyCard = document.getElementById("enemyCard");
    if (enemyCard) {
        enemyCard.classList.add("hit-shake");
        setTimeout(() => enemyCard.classList.remove("hit-shake"), 200);
    }

    document.getElementById("enemyHp").style.width = (enemyCurrentHp / enemyHpMax * 100) + "%";
    document.getElementById("combatLog").innerText = `Você causou ${damage} de dano!`;

    if (enemyCurrentHp === 0) {
        playerState.gold += currentEnemy.gold;
        
        if (currentEnemy.isBoss) {
            document.getElementById("combatLog").innerText = "👑 CHEFÃO DERROTADO!";
            unlockAchievement("Mestre do Código", "Derrotou O Grande Refatorador!", "👑");
            addXp(currentEnemy.xp);
            
            setTimeout(() => {
                alert(`👑 VITÓRIA ÉPICA!\nGanhou +${currentEnemy.xp} XP e +${currentEnemy.gold} Gold!`);
                switchZone('normal');
            }, 500);
        } else {
            document.getElementById("combatLog").innerText = `💥 ${currentEnemy.name} Derrotado! (+${currentEnemy.xp} XP / +${currentEnemy.gold} Gold)`;
            addXp(currentEnemy.xp);
            
            setTimeout(() => {
                switchZone('normal');
            }, 1200);
        }
    }
}

function spawnDamageNumber(amount) {
    const box = document.querySelector(".dungeon-box");
    if (!box) return;
    const pop = document.createElement("span");
    pop.className = "damage-pop";
    pop.innerText = `-${amount}`;
    pop.style.left = `calc(50% + ${Math.random() * 60 - 30}px)`;
    pop.style.top = "70px";

    box.appendChild(pop);
    setTimeout(() => pop.remove(), 800);
}

// --- QUESTS / PROJETOS ---
function completeQuest(questId, xpReward, goldReward, projectUrl) {
    const btn = document.querySelector(`#${questId} button`);
    if (!btn || btn.disabled) return;

    btn.disabled = true;
    btn.innerText = "Concluída ✓";
    btn.style.borderColor = "#555";
    
    playerState.gold += goldReward;
    addXp(xpReward);
    window.open(projectUrl, "_blank");
}

// --- INICIALIZAÇÃO E EVENTOS DE CLIQUE ---
document.addEventListener("DOMContentLoaded", () => {
    
    // Botão Iniciar Aventura (Tela Inicial)
    const enterBtn = document.getElementById("enter");
    if (enterBtn) {
        enterBtn.addEventListener("click", () => {
            document.getElementById("home").style.display = "none";
            document.getElementById("loading").style.display = "flex";

            let progress = 0;
            const timer = setInterval(() => {
                progress += 5;
                document.getElementById("progress").style.width = progress + "%";
                document.getElementById("percent").innerText = progress + "%";

                if (progress >= 100) {
                    clearInterval(timer);
                    document.getElementById("loading").style.display = "none";

                    loadProgress();

                    const savedName = localStorage.getItem("playerName");
                    if (savedName) {
                        playerState.name = savedName;
                        document.getElementById("hudName").innerText = savedName;
                        document.getElementById("profileName").innerText = savedName;
                        document.getElementById("hub").style.display = "flex";
                    } else {
                        document.getElementById("register").style.display = "flex";
                    }
                }
            }, 20);
        });
    }

    // Botão Criar Perfil
    const startBtn = document.getElementById("start");
    if (startBtn) {
        startBtn.addEventListener("click", () => {
            const inputName = document.getElementById("playerName");
            const nome = inputName ? inputName.value.trim() : "";
            if (!nome) return alert("Digite seu nome!");

            localStorage.setItem("playerName", nome);
            playerState.name = nome;
            document.getElementById("hudName").innerText = nome;
            document.getElementById("profileName").innerText = nome;

            document.getElementById("register").style.display = "none";
            document.getElementById("hub").style.display = "flex";
            saveProgress();
        });
    }

    // Abertura de Janelas
    document.querySelectorAll(".hub-card").forEach(card => {
        card.addEventListener("click", () => {
            const targetId = card.getAttribute("data-target");
            const targetWin = document.getElementById(targetId);
            if (targetWin) targetWin.classList.add("active");
        });
    });

    // Fechamento de Janelas
    document.querySelectorAll(".close-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
            const win = e.target.closest(".window");
            if (win) win.classList.remove("active");
        });
    });

    // NPC Guia Interativo
    const npc = document.getElementById("npcGuide");
    if (npc) {
        npc.addEventListener("click", () => {
            document.getElementById("npcDialog").innerText = npcTips[tipIndex];
            tipIndex = (tipIndex + 1) % npcTips.length;
        });

        let isNpcDrag = false, npcX = 0, npcY = 0;
        npc.addEventListener("mousedown", (e) => {
            isNpcDrag = true;
            npcX = e.clientX - npc.offsetLeft;
            npcY = e.clientY - npc.offsetTop;
        });

        document.addEventListener("mousemove", (e) => {
            if (!isNpcDrag) return;
            npc.style.left = (e.clientX - npcX) + "px";
            npc.style.top = (e.clientY - npcY) + "px";
            npc.style.bottom = "auto";
        });

        document.addEventListener("mouseup", () => isNpcDrag = false);
    }
});
// Abertura de Janelas com Sorteio de Inimigos
document.querySelectorAll(".hub-card").forEach(card => {
    card.addEventListener("click", () => {
        const targetId = card.getAttribute("data-target");
        const targetWin = document.getElementById(targetId);
        
        if (targetWin) {
            targetWin.classList.add("active");

            // Se abriu a Masmorra, sorteia um inimigo automaticamente
            if (targetId === "windowDungeon") {
                switchZone('normal');
            }
        }
    });
});