let testTime = 10 * 1000, testing = false, tested = false;
let leftCnt = 0, rightCnt = 0;

const setTestTime = (time) => {
    testTime = time * 1000;
    document.getElementById('cpsTestTime').innerText = `当前测试时长：${time}秒`;
}

const onTestClick = (button) => {
    if (tested) return;
    if (!testing) {
        leftCnt = rightCnt = 0;
        testing = true;
        let testLast = testTime;
        let t = setInterval(() => {
            if (testLast == 0 || tested) {
                clearInterval(t);
                testing = false;
                tested = true;
                document.getElementById('testCpsButton').innerHTML = `剩余时间：${testLast / 1000}秒<br>左键点击次数：${leftCnt}，右键点击次数${rightCnt}`;
                let result = document.getElementById('cpsTestResult');
                if (rightCnt == 0)
                    return result.innerHTML = `你的左键点击速度为<b>${leftCnt * 1000 / testTime}</b>CPS`;
                if (leftCnt == 0)
                    return result.innerHTML = `你的右键点击速度为<b>${rightCnt * 1000 / testTime}</b>CPS`;
                return result.innerHTML = `你的左键点击速度为<b>${leftCnt * 1000 / testTime}</b>CPS，右键点击速度为<b>${rightCnt * 1000 / testTime}</b>CPS`;
            }
            testLast -= 100;
            document.getElementById('testCpsButton').innerHTML = `剩余时间：${testLast / 1000}秒<br>左键点击次数：${leftCnt}，右键点击次数${rightCnt}`;
        }, 100);
    }
    if (button == 0) leftCnt++;
    if (button == 2) rightCnt++;
}

const resetTest = () => {
    tested = false;
    document.getElementById('cpsTestResult').innerHTML = '';
    document.getElementById('testCpsButton').innerHTML = '点此开始测试';
}