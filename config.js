﻿(function() {
	function clearBattleCount(callback) {
		chrome.storage.sync.set({"battleCount": 0}, callback);
	}
	function updateActiveButton() {
		chrome.storage.sync.get(["isAutoBattle"], function(data) {
			const activateAutoButton = document.querySelector("#activateAuto")
			if (!data.isAutoBattle) {
				activateAutoButton.innerHTML = "자동사냥 시작";
				activateAutoButton.classList.remove("error");
			} else {
				document.querySelector("#activateAuto").innerHTML = "자동사냥 종료";
				activateAutoButton.classList.add("error");
			}
		});
	}
	
	function updateBattleDuration() {
		chrome.storage.sync.get(["autoBattleDuration", "autoBattleFiveSecDuration"], function(data) {
			if (data.autoBattleDuration === undefined) {
				document.querySelector("#battleDuration").value = "9000";
			} else {
				document.querySelector("#battleDuration").value = data.autoBattleDuration;
			}
			if (data.autoBattleFiveSecDuration === undefined) {
				document.querySelector("#battleFiveSecDuration").value = "4000";
			} else {
				document.querySelector("#battleFiveSecDuration").value = data.autoBattleFiveSecDuration;
			}
		});
	}
	
	function updateAutoBattleLog() {
		chrome.storage.sync.get(["autoBattleLog"], function(data) {
			const logDom = document.querySelector("#autoBattleLog")
			logDom.innerHTML = data.autoBattleLog
		});
	}
	
	function updateBattleLog() {
		chrome.storage.sync.get(["battleLog"], function(data) {
			const logDom = document.querySelector("#log")
			logDom.innerHTML = data.battleLog
		});
	};
	
	function clearBattleLog() {
		chrome.storage.sync.set({"battleLog": ""}, updateBattleLog);
	}
	
	function getCurrentDateString() { 
		function pad(n) { return n<10 ? "0"+n : n } 
		const d=new Date() 
		return pad(d.getMonth()+1) + "-" + pad(d.getDate()) + " " + pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds()) 
	}
	
	function addLog(str) {
		chrome.storage.sync.get(["battleLog"], function(data) {
			const allLog = "[" + getCurrentDateString() + "] " + str + "\n" + data.battleLog
			var splitLogs = allLog.split("\n");
			
			if (splitLogs.length > 100) {
				splitLogs = splitLogs.slice(0, 100)
			}
			chrome.storage.sync.set({"battleLog": splitLogs.join("\n")}, function() {
				
			})
		})
	}
	
	function getGuildWarTimeAndAlarm(callback) {
		chrome.storage.sync.get(["guildwarTime", "guildwarAlarm"], callback);
	}

	function playSound() {
		if (typeof(audio) != "undefined" && audio) {
			audio.pause();
			document.body.removeChild(audio);
			audio = null;
		}
		audio = document.createElement('audio');
		document.body.appendChild(audio);
		audio.autoplay = true;
		audio.src = 'alarm.wav';
		audio.play();
	}
	
	function createWebWorker(workercode, action) {
		let code = workercode.toString();
		code = code.substring(code.indexOf("{") + 1, code.lastIndexOf("}"));

		const blob = new Blob([code], { type: "application/javascript" });
		const worker_script = new Worker(URL.createObjectURL(blob));

		worker_script.onmessage = ({ data: { data } }) => {
			action();
		};
		
		return worker_script;
	}

	function create1000msIntervalWorker(action) {
		const workercode = () => {
		  setInterval(() => {
			self.postMessage({ done: "done" });
		  }, 1000);
		};
		
		return createWebWorker(workercode, action);
	}
	
	create1000msIntervalWorker(function() {
		getGuildWarTimeAndAlarm(function(data) {
			if (!data.guildwarAlarm || !data.guildwarTime) {
				return;
			}
			
			if (new Date().getTime() - data.guildwarTime >= 1000 * 60 * 10) {
				playSound();
				chrome.storage.sync.set({"guildwarAlarm": false});
				addLog("길드전 수행가능");
			}
		});
	});
	
	document.querySelector("#activateAuto").addEventListener("click", function() {
		
		chrome.storage.sync.get(["isAutoBattle"], function(data) {
			var isActivate = !data.isAutoBattle
			clearBattleCount(function() {
				chrome.storage.sync.set({"isAutoBattle": isActivate}, function() {
					updateActiveButton();
				});
			});

		});
	});
	
	document.querySelector("#changeDuration").addEventListener("click", function() {
		const duration = document.querySelector("#battleDuration").value
		const fiveSecDuration = document.querySelector("#battleFiveSecDuration").value 
		//TODO 숫자 검증 범위 검증
		chrome.storage.sync.set({"autoBattleDuration": duration, "autoBattleFiveSecDuration": fiveSecDuration}, function() {
			updateBattleDuration();
		});
	});
	
	document.querySelector("#clearBattleLog").addEventListener("click", function() {
		clearBattleLog();
	});
	
	updateActiveButton();
	updateBattleDuration();
	updateBattleLog();
	setInterval(updateBattleLog, 1000);
	setInterval(updateAutoBattleLog, 1000);
	
})();