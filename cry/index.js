
        // Firebase 配置
        const firebaseConfig = {
            apiKey: "AIzaSyCEKE2x7-D67OU1u8_lq4ejHkb4hn-tPbo",
            authDomain: "ecg0808-ab2f3.firebaseapp.com",
            projectId: "ecg0808-ab2f3",
            storageBucket: "ecg0808-ab2f3.appspot.com",
            messagingSenderId: "161107516714",
            appId: "1:161107516714:web:a4bba58eb8f704a02d5253",
            measurementId: "G-BQ4VNE260F"
        };

        // 初始化 Firebase
        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();
        const db = firebase.firestore();
        
        // 初始化 Google 登錄提供者
        const provider = new firebase.auth.GoogleAuthProvider();

        // DOM 元素
        const authSection = document.getElementById('authSection');
        const userSection = document.getElementById('userSection');
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        const sadCoinsCount = document.getElementById('sadCoinsCount');
        const sadCoinsEarned = document.getElementById('sadCoinsEarned');
        const googleLoginBtn = document.getElementById('googleLoginBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const saveBtn = document.getElementById('saveBtn');
        const scoreValue = document.getElementById('scoreValue');
        const leaderboardList = document.getElementById('leaderboardList');
        const leaderboardLoginPrompt = document.getElementById('leaderboardLoginPrompt');
        
        // 用戶狀態跟蹤
        let currentUser = null;
        let currencies = {
            sadCoin: 0,  // 悲傷幣
        };
        let earnedSadCoins = 0;
        let coins = 0; // 情緒幣

        // 用戶認證狀態監聽
        auth.onAuthStateChanged(user => {
            if (user) {
                // 用戶已登錄
                currentUser = user;
                authSection.style.display = 'none';
                userSection.style.display = 'flex';
                leaderboardList.style.display = 'flex';
                leaderboardLoginPrompt.style.display = 'none';
                userName.textContent = user.displayName || "Google用戶";
                userEmail.textContent = user.email;
                // 設置用戶頭像
                if (user.photoURL) {
                    userAvatar.src = user.photoURL;
                } else {
                    userAvatar.parentElement.innerHTML = '<i class="fas fa-user"></i>';
                }
                // 首次被邀請人登入時給雙方加分
                handleReferralReward(user);
                // 從Firestore加載用戶數據
                loadUserData();
                // 加載富豪榜
                loadLeaderboard();
                // 生成分享鏈接
                generateShareLink();
            } else {
                // 用戶未登錄
                currentUser = null;
                authSection.style.display = 'block';
                userSection.style.display = 'none';
                currencies = { sadCoin: 0 };
                sadCoinsCount.textContent = currencies.sadCoin;
                leaderboardList.style.display = 'none';
                leaderboardLoginPrompt.style.display = 'block';
            }
        });

        // 生成分享鏈接（直接用uid）
        function generateShareLink() {
            if (!currentUser) return;
            const shareUrl = `${window.location.origin}${window.location.pathname}?ref=${currentUser.uid}`;
            document.getElementById('shareUrl').textContent = shareUrl;
            return shareUrl;
        }

                // 名字修改功能
                const editNameBtn = document.getElementById('editNameBtn');
                const customNameEditBox = document.getElementById('customNameEditBox');
                const customNameInput = document.getElementById('customNameInput');
                const saveNameBtn = document.getElementById('saveNameBtn');
                const cancelNameBtn = document.getElementById('cancelNameBtn');

                // 顯示input
                editNameBtn.addEventListener('click', () => {
                    customNameEditBox.style.display = 'flex';
                    editNameBtn.style.display = 'none';
                    customNameInput.value = userName.textContent;
                    setTimeout(()=>customNameInput.focus(), 100);
                });

                // 取消
                cancelNameBtn.addEventListener('click', () => {
                    customNameEditBox.style.display = 'none';
                    editNameBtn.style.display = 'inline-block';
                });

                // 保存自定義名稱
                saveNameBtn.addEventListener('click', async () => {
                    if (!currentUser) {
                        alert('請先登入以設置名稱');
                        return;
                    }
                    const newName = customNameInput.value.trim();
                    if (!newName) {
                        alert('請輸入有效的名稱');
                        return;
                    }
                    if (newName === userName.textContent) {
                        alert('新名稱與目前名稱相同，請輸入不同名稱');
                        return;
                    }
                    // 查詢是否有重複名稱
                    const query = await db.collection('users').where('customName', '==', newName).get();
                    if (!query.empty) {
                        alert('此名稱已被使用，請換一個');
                        return;
                    }
                    // 檢查是否有足夠的情緒幣
                    if (coins < 1) {
                        alert(`
                            情緒不足，！需要1點情緒才能修改名稱！
                            充值情緒：
                            1❤️ = $10hkd
                            請按匯率換算為您的貨幣
                            付款後請將收據及帳號發信給我們
                            謝謝您的支持！
                            (確認後將轉到付款頁面))
                            `);
                        setTimeout(()=>{ window.open('https://64071181.github.io/PayAki/index.html', '_blank'); }, 800);
                        return;
                    }
                    // 扣除1枚情緒幣並更新名稱
                    coins -= 1;
                    document.getElementById('userCoins').textContent = coins;
                    // 保存到數據庫
                    db.collection('users').doc(currentUser.uid).update({
                        customName: newName,
                        coins: coins
                    })
                    .then(() => {
                        userName.textContent = newName;
                        alert('名稱設置成功，並扣除1點情緒！');
                        customNameEditBox.style.display = 'none';
                        editNameBtn.style.display = 'inline-block';
                        loadLeaderboard();
                    })
                    .catch(error => {
                        console.error('保存名稱失敗:', error);
                        alert('保存失敗，請稍後再試');
                    });
                });

        // Google登錄功能
        googleLoginBtn.addEventListener('click', () => {
            auth.signInWithPopup(provider)
                .then((result) => {
                    // 登錄成功
                    console.log("Google登錄成功", result.user);
                })
                .catch((error) => {
                    // 處理錯誤
                    console.error("Google登錄錯誤:", error);
                    alert(`登錄失敗: ${error.message}`);
                });
        });

        // 登出功能
        logoutBtn.addEventListener('click', () => {
            auth.signOut()
                .then(() => {
                    console.log("用戶已登出");
                })
                .catch((error) => {
                    console.error("登出錯誤:", error);
                });
        });

        // 保存悲傷幣
        saveBtn.addEventListener('click', () => {
            if (!currentUser) {
                alert('請先登入以保存悲傷幣');
                return;
            }
            if (earnedSadCoins === 0) {
                alert('您還沒有獲取悲傷幣，請先進行分析');
                return;
            }
            if (coins < 1) {
                alert(`
                    情緒不足，需1點情緒才能保存悲傷幣！
                    充值情緒：
                    1❤️ = $10hkd
                    請按匯率換算為您的貨幣
                    付款後請將收據及帳號發信給我們
                    謝謝您的支持！
                    (確認後將轉到付款頁面))
                    `);
                setTimeout(()=>{ window.open('https://64071181.github.io/PayAki/index.html', '_blank'); }, 800);
                return;
            }
            // 扣除1點情緒
            coins -= 1;
            document.getElementById('userCoins').textContent = coins;
            // 更新用戶數據
            currencies.sadCoin += earnedSadCoins;
            sadCoinsCount.textContent = currencies.sadCoin;
            saveUserData();
            alert(`已成功保存 ${earnedSadCoins} 枚悲傷幣，並扣除1點情緒！`);
            earnedSadCoins = 0;
            sadCoinsEarned.textContent = '0';
            // 保存後刷新富豪榜
            loadLeaderboard();
        });

        // 從Firestore加載用戶數據
        function loadUserData() {
            if (!currentUser) return;
            
            db.collection('users').doc(currentUser.uid).get()
                .then(doc => {
                    if (doc.exists) {
                        const data = doc.data();
                        
                        // 加載貨幣數據
                        if (data.currencies) {
                            currencies = data.currencies;
                        } else if (data.coins !== undefined) {
                            // 兼容舊數據結構
                            currencies = {
                                sadCoin: data.coins || 0
                            };
                        }
                        
                        // 顯示情緒 coins
                        coins = data.coins || 0;
                        document.getElementById('userCoins').textContent = coins;
                        sadCoinsCount.textContent = currencies.sadCoin || 0;
                        
                        // 關鍵修復：優先顯示customName，其次是displayName
                        const displayName = data.customName || data.displayName || currentUser.displayName || "匿名用戶";
                        userName.textContent = displayName;
                        
                        // 同步輸入框值
                        if (customNameInput) {
                            customNameInput.value = data.customName || '';
                        }

                        // 核心邏輯：檢查是否需要贈送每日情緒幣
                        checkDailyCoinGift(data);
                    } else {
                        // 創建新用戶文檔
                        saveUserData();
                    }
                });
        }

        // 檢查並贈送每日情緒幣
        function checkDailyCoinGift(userData) {
            const userCoins = userData.coins || 0;
            const lastGiftDate = userData.lastGiftDate || null;
            // 以台灣時區（UTC+8）計算今日日期
            const now = new Date();
            const utc8 = new Date(now.getTime() + (8 * 60 * 60 * 1000));
            const today = utc8.toISOString().slice(0, 10); // 'YYYY-MM-DD'

            // 條件：情緒幣為0 且 今天未領取過
            if (userCoins === 0 && lastGiftDate !== today) {
                // 贈送3個情緒幣，並正確更新 lastGiftDate
                const newCoins = 3;
                db.collection('users').doc(currentUser.uid).set({
                    coins: newCoins,
                    lastGiftDate: today
                }, { merge: true }).then(() => {
                    coins = newCoins;
                    document.getElementById('userCoins').textContent = newCoins;
                    alert('🎉 今日首次登錄，贈送3個情緒幣！');
                }).catch(error => {
                    console.error('贈送情緒幣失敗：', error);
                    alert('贈送失敗，請稍後重試');
                });
            }
        }

        // 保存用戶數據到Firestore
        function saveUserData() {
            if (!currentUser) return;
            // 構建要保存的數據對象
            const userData = {
                uid: currentUser.uid,
                email: currentUser.email,
                displayName: currentUser.displayName || '',
                photoURL: currentUser.photoURL || '',
                currencies: currencies,  // 保存多種貨幣
                isVIP: false,
                lastLogin: new Date(),
                coins: coins // 情緒幣
                // 不主動設 lastGiftDate，避免覆蓋
            };
            db.collection('users').doc(currentUser.uid).get()
                .then(doc => {
                    if (!doc.exists) {
                        // 新用戶，添加customName初始值與 lastGiftDate:null
                        userData.customName = '';
                        userData.lastGiftDate = null;
                        return db.collection('users').doc(currentUser.uid).set(userData);
                    } else {
                        // 現有用戶，合併數據，不覆蓋 lastGiftDate
                        return db.collection('users').doc(currentUser.uid).set(userData, { merge: true });
                    }
                })
                .then(() => {
                    loadLeaderboard();
                })
                .catch(error => {
                    console.error('保存數據失敗:', error);
                });
        }

        // 加載富豪榜數據
        function loadLeaderboard() {
            // 如果未登錄，直接返回
            if (!currentUser) return;

            // 顯示加載狀態
            const items = leaderboardList.querySelectorAll('.leaderboard-item');
            items.forEach(item => {
                item.querySelector('.leaderboard-name').textContent = '載入中...';
                item.querySelector('.leaderboard-coins span').textContent = '0';
            });
            
            // 查詢前5名用戶（按悲傷幣降序）
            db.collection('users')
                .orderBy('currencies.sadCoin', 'desc')
                .limit(5)
                .get()
                .then(querySnapshot => {
                    const leaders = [];
                    querySnapshot.forEach(doc => {
                        const userData = doc.data();
                        const userName = userData.customName || userData.displayName || '匿名用戶';
                        leaders.push({
                            name: userName,
                            coins: userData.currencies?.sadCoin || 0
                        });
                    });
                    
                    // 更新UI
                    updateLeaderboardUI(leaders);
                })
                .catch(error => {
                    console.error('加載富豪榜失敗:', error);
                    // 顯示錯誤狀態
                    items.forEach(item => {
                        item.querySelector('.leaderboard-name').textContent = '加載失敗';
                        item.querySelector('.leaderboard-coins span').textContent = '0';
                    });
                });
        }

        // 更新富豪榜UI
        function updateLeaderboardUI(leaders) {
            const items = leaderboardList.querySelectorAll('.leaderboard-item');
            
            // 確保至少有5個條目
            for (let i = 0; i < 5; i++) {
                const item = items[i];
                if (!item) continue;
                
                if (i < leaders.length) {
                    const leader = leaders[i];
                    item.querySelector('.leaderboard-name').textContent = leader.name;
                    item.querySelector('.leaderboard-coins span').textContent = leader.coins;
                    
                    // 高亮當前用戶
                    if (currentUser && leader.name === userName.textContent) {
                        item.style.border = '2px solid #ffd66b';
                        item.style.boxShadow = '0 0 15px rgba(255, 214, 107, 0.5)';
                    } else {
                        item.style.border = '1px solid rgba(138, 79, 255, 0.2)';
                        item.style.boxShadow = 'none';
                    }
                } else {
                    item.querySelector('.leaderboard-name').textContent = '等待上榜';
                    item.querySelector('.leaderboard-coins span').textContent = '0';
                }
            }
        }

        // 創建淚滴效果
        function createTears() {
            const tearsCount = 20;
            for (let i = 0; i < tearsCount; i++) {
                setTimeout(() => {
                    const tear = document.createElement('div');
                    tear.classList.add('teardrop');
                    
                    const size = Math.random() * 20 + 10;
                    const left = Math.random() * 100;
                    const duration = Math.random() * 5 + 3;
                    const delay = Math.random() * 5;
                    
                    tear.style.width = `${size}px`;
                    tear.style.height = `${size * 1.5}px`;
                    tear.style.left = `${left}%`;
                    tear.style.animationDuration = `${duration}s`;
                    tear.style.animationDelay = `${delay}s`;
                    
                    document.body.appendChild(tear);
                    
                    // 移除淚滴元素
                    setTimeout(() => {
                        tear.remove();
                    }, (duration + delay) * 1000);
                }, i * 300);
            }
        }
        
        // 每10秒創建一批淚滴
        setInterval(createTears, 10000);
        createTears(); // 初始創建
        
        // 錄音功能
        const recordBtn = document.getElementById('recordBtn');
        const timer = document.getElementById('timer');
        const canvas = document.getElementById('waveform');
        const ctx = canvas.getContext('2d');
        
        // 設置Canvas尺寸
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        
        let isRecording = false;
        let startTime;
        let timerInterval;
        let audioContext;
        let analyser;
        let dataArray;
        let source;
        let stream;
        
        // 繪製波形
        function drawWaveform() {
            if (!isRecording) return;
            
            requestAnimationFrame(drawWaveform);
            
            analyser.getByteTimeDomainData(dataArray);
            
            ctx.fillStyle = 'rgba(10, 10, 30, 0.2)';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#8a4fff';
            ctx.beginPath();
            
            const sliceWidth = canvas.width / analyser.frequencyBinCount;
            let x = 0;
            
            for (let i = 0; i < analyser.frequencyBinCount; i++) {
                const v = dataArray[i] / 128.0;
                const y = v * canvas.height / 2;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                x += sliceWidth;
            }
            
            ctx.lineTo(canvas.width, canvas.height / 2);
            ctx.stroke();
        }
        
        // 開始錄音
        async function startRecording() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                analyser = audioContext.createAnalyser();
                analyser.fftSize = 2048;
                
                source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);
                
                dataArray = new Uint8Array(analyser.frequencyBinCount);
                
                isRecording = true;
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '<i class="fas fa-stop"></i>';
                startTime = Date.now();
                
                // 更新計時器
                timerInterval = setInterval(() => {
                    const elapsedTime = Date.now() - startTime;
                    const seconds = Math.floor(elapsedTime / 1000);
                    timer.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
                }, 1000);
                
                drawWaveform();
            } catch (err) {
                console.error('錄音錯誤:', err);
                alert('無法訪問麥克風，請確保已授予權限');
            }
        }
        
        // 停止錄音
        function stopRecording() {
            isRecording = false;
            recordBtn.classList.remove('recording');
            recordBtn.innerHTML = '<i class="fas fa-microphone"></i>';
            clearInterval(timerInterval);
            
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            
            // 分析錄音
            analyzeRecording();
        }
        
        // 分析錄音並計算分數
        function analyzeRecording() {
            // 更新分析狀態
            document.getElementById('analysisTitle').textContent = '正在分析中...';
            document.getElementById('analysisDesc').textContent = '我們正在解讀你的悲傷，請稍候';
            
            // 模擬分析過程
            setTimeout(() => {
                // 隨機生成分數 (60-95之間)
                const totalScore = Math.floor(Math.random() * 36) + 60;
                scoreValue.textContent = totalScore;
                
                // 計算獲得的悲傷幣 (分數除以3)
                earnedSadCoins = Math.floor(totalScore / 3);
                sadCoinsEarned.textContent = earnedSadCoins;
                
                // 更新硬幣顯示 - 修復了硬幣顯示問題
                const coins = document.querySelectorAll('.coin');
                const coinValue = Math.floor(earnedSadCoins / coins.length);
                
                coins.forEach((coin, index) => {
                    setTimeout(() => {
                        coin.textContent = `+${coinValue}`;
                        coin.style.animation = 'none'; // 重置動畫
                        setTimeout(() => {
                            coin.style.animation = 'float 4s ease-in-out infinite';
                        }, 10);
                    }, index * 300);
                });
                
                // 更新分析結果文本
                document.getElementById('analysisTitle').textContent = '情感分析完成';
                
                let feedbackText = '';
                if (totalScore < 30) {
                    feedbackText = '檢測到輕度悲傷情緒，每一次釋放都是療癒的開始';
                } else if (totalScore < 60) {
                    feedbackText = '檢測到中度悲傷情緒，你的感受值得被溫柔對待';
                } else if (totalScore < 80) {
                    feedbackText = '檢測到深度悲傷情緒，你的勇氣讓這些情感得以釋放';
                } else {
                    feedbackText = '檢測到強烈悲傷情緒，感謝你將這些沉重交給我們';
                }
                
                document.getElementById('analysisDesc').textContent = `${feedbackText}`;
                
            }, 2000);
        }
        
        // 錄音按鈕事件
        recordBtn.addEventListener('click', () => {
            if (!isRecording) {
                startRecording();
            } else {
                stopRecording();
            }
        });
        
        // 分享功能實現
        const shareModal = document.getElementById('shareModal');
        const modalClose = document.getElementById('modalClose');
        const modalCopy = document.getElementById('modalCopy');
        //const modalShare = document.getElementById('modalShare');
        const successMessage = document.getElementById('successMessage');
        const copyLink = document.getElementById('copyLink');
        
        // 打開分享模態框
        function openShareModal() {
            if (!currentUser) {
                alert('請先登入以分享');
                return;
            }
            
            const referralId = currentUser.uid.substring(0, 8) + Math.floor(Math.random() * 1000);
            const shareUrl = `${window.location}?ref=${referralId}`;
            document.getElementById('shareUrl').textContent = shareUrl;
            
            shareModal.style.display = 'flex';
        }
        
        // 關閉模態框
        modalClose.addEventListener('click', () => {
            shareModal.style.display = 'none';
            successMessage.style.display = 'none';
        });
        
        // 點擊模態框外部關閉
        shareModal.addEventListener('click', (e) => {
            if (e.target === shareModal) {
                shareModal.style.display = 'none';
                successMessage.style.display = 'none';
            }
        });
        
        // 複製鏈接功能
        function copyToClipboard() {
            const shareUrl = document.getElementById('shareUrl').textContent;
            navigator.clipboard.writeText(shareUrl).then(() => {
                successMessage.style.display = 'block';
                setTimeout(() => {
                    successMessage.style.display = 'none';
                }, 3000);
            }).catch(err => {
                console.error('複製失敗:', err);
                alert('複製失敗，請手動複製鏈接');
            });
        }
        
        // 直接分享功能
        function nativeShare() {
            const shareUrl = document.getElementById('shareUrl').textContent;
            const title = '悲傷回收站';
            const text = `我剛剛在悲傷回收站獲得了${earnedSadCoins}枚悲傷幣！加入我一起將悲傷轉化為力量。`;
            
            if (navigator.share) {
                navigator.share({
                    title: title,
                    text: text,
                    url: shareUrl
                }).catch(error => {
                    console.log('分享失敗', error);
                });
            } else {
                copyToClipboard();
            }
        }
        
        // 事件綁定
        modalCopy.addEventListener('click', copyToClipboard);
        //modalShare.addEventListener('click', nativeShare);
        copyLink.addEventListener('click', openShareModal);
        
    // 移除分享即加分，改為首次被邀請人登入時才加分
        // 首次被邀請人登入時給雙方加分
        function handleReferralReward(user) {
            // 只在首次登入時處理
            if (!user) return;
            const urlParams = new URLSearchParams(window.location.search);
            const refUid = urlParams.get('ref');
            if (!refUid || refUid === user.uid) return; // 無ref或自己邀自己

            // 取得自己user資料，檢查是否已經領過ref獎勵
            db.collection('users').doc(user.uid).get().then(doc => {
                const data = doc.data();
                if (data && data.refRewarded) return; // 已領過

                // 給自己加1點情緒
                const newCoins = (data?.coins || 0) + 1;
                db.collection('users').doc(user.uid).update({
                    coins: newCoins,
                    refRewarded: refUid
                });

                // 給分享人加1點情緒（需檢查分享人存在）
                db.collection('users').doc(refUid).get().then(refDoc => {
                    if (!refDoc.exists) return;
                    const refData = refDoc.data();
                    const refNewCoins = (refData?.coins || 0) + 1;
                    db.collection('users').doc(refUid).update({
                        coins: refNewCoins
                    });
                });

                // 彈窗提示
                setTimeout(() => {
                    alert('🎉 首次通過好友邀請連結登入，您和好友各獲得1點情緒！');
                }, 1000);
            });
        }
        

        

        
        // 悲傷小店功能
        document.addEventListener('DOMContentLoaded', function() {
            const shopBtns = document.querySelectorAll('.shop-buy-btn');
            const shopMsg = document.getElementById('shopMsg');
            shopBtns.forEach(btn => {
                btn.addEventListener('click', async function() {
                    // firebase user check
                    if (!currentUser || !currentUser.uid) {
                        shopMsg.textContent = '請先登入才能兌換';
                        return;
                    }
                    // 取得目前悲傷幣與情緒幣
                    let sadCoins = 0;
                    let emoCoins = 0;
                    try {
                        sadCoins = parseInt(document.getElementById('sadCoinsCount').textContent)||0;
                        emoCoins = parseInt(document.getElementById('userCoins').textContent)||0;
                    } catch(e) {}
                    let need = 0, item = btn.getAttribute('data-item'), itemName = '';
                    // 兌換物品設定
                    let openUrl = '';
                    if(item==='dogMov'||item==='可愛狗狗影片'){
                        need=10; itemName='可愛狗狗影片'; openUrl='https://www.youtube.com/results?search_query=dog+funny+video';
                    }
                    if(item==='catMov'||item==='可愛貓貓影片'){
                        need=10; itemName='可愛貓貓影片'; openUrl='https://www.youtube.com/results?search_query=cat+funny+video';
                    }
                    if(item==='monsterImg'||item==='可愛小怪獸頭像'){
                        need=10; itemName='可愛小怪獸頭像'; openUrl='https://www.pinterest.com/search/pins/?q=cute%20monster%20avatar';
                    }
                    if(item==='FreeSpiritualSupport'||item==='免費心靈支援'){
                        need=10; itemName='免費心靈支援'; openUrl='https://www.sprc.org.tw/';
                    }
                    
                    if(sadCoins<need){
                        alert('悲傷幣不足，無法兌換');
                        return;
                    }
                    if(emoCoins<1){
                        alert(`
                            情緒不足，需1點情緒才能兌換！
                            充值情緒：
                            1❤️ = $10hkd
                            請按匯率換算為您的貨幣
                            付款後請將收據及帳號發信給我們
                            謝謝您的支持！
                            (確認後將轉到付款頁面))
                            `);
                        setTimeout(()=>{ window.open('https://64071181.github.io/PayAki/index.html', '_blank'); }, 800);
                        return;
                    }
                    // firebase 扣除
                    try {
                        // 先取得最新用戶資料
                        const userDoc = await db.collection('users').doc(currentUser.uid).get();
                        const data = userDoc.data();
                        let newSad = (data.currencies?.sadCoin || 0) - need;
                        let newEmo = (data.coins || 0) - 1;
                        if(newSad<0 || newEmo<0){
                            shopMsg.textContent = '餘額不足，請重新整理';
                            return;
                        }
                        // 更新firebase
                        await db.collection('users').doc(currentUser.uid).update({
                            'currencies.sadCoin': newSad,
                            coins: newEmo
                        });
                        // 前端同步
                        document.getElementById('sadCoinsCount').textContent = newSad;
                        document.getElementById('userCoins').textContent = newEmo;
                        shopMsg.textContent = `已成功兌換「${itemName}」，扣除${need}枚悲傷幣與1點情緒！`;
                                                setTimeout(()=>{shopMsg.textContent='';}, 3500);
                                                if(openUrl){
                                                    setTimeout(()=>{ window.open(openUrl, '_blank'); }, 800);
                                                }
                    } catch(e) {
                        shopMsg.textContent = '兌換失敗，請稍後再試';
                    }
                });
            });
        });

        