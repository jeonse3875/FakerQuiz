# Faker Quiz

## 1. 프로젝트 소개
Faker Quiz는 프로게이머 Faker 선수의 기록을 퀴즈로 출제해주는 LINE 챗봇입니다.<br><br>
데이터 출처 : [롤 인벤 기록실](http://lol.inven.co.kr/dataninfo/proteam/progamer.php?code=135)

## 2. 설치 방법
1. Repository를 clone합니다.
```{.bash}
$ git clone http://khuhub.khu.ac.kr/2019102225/FakerQuiz.git
```
2. FakerQuiz repo로 이동하여 [letsencrypt](https://letsencrypt.org/ko/)를 clone합니다.
```{.bash}
$ cd FakerQuiz/
$ git clone https://github.com/letsencrypt/letsencrypt
```
3. SSL 인증서를 발급합니다.
```{.bash}
$ ./letsencrypt/letsencrypt-auto certonly
```
4. 필요한 node module을 install합니다.
```{.bash}
$ npm install
```

## 3. 사용 방법
### 3-1. 실행 방법
1. [LINE Developers](https://developers.line.biz/en/)에 접속하여 Messaging API channel을 생성합니다.
2. Messaging API settings에서 Webhook URL을 설정하고 Use webhook을 enable합니다.
```{.no-highlight}
https://[yourURL]:23023/hook
```
3. Channel access token을 발급받습니다.
4. `app.js`를 열어 `domain`과 `TOKEN`을 입력합니다.
5. `app.js`를 실행하고 Webhook URL을 Verify합니다.
```{.bash}
$ node app.js
```
6. LINE 채널을 친구추가하고 작동을 확인합니다.

### 3-2. 다른 선수의 퀴즈 만들기
1. [롤 인벤 기록실](http://lol.inven.co.kr/dataninfo/match/playerList.php)에서 원하는 선수의 기록실 링크를 복사합니다.
2. `app.js`에서 `url`을 복사한 링크로 교체합니다.
3. [3-1](http://khuhub.khu.ac.kr/2019102225/FakerQuiz#3-1-%EC%8B%A4%ED%96%89-%EB%B0%A9%EB%B2%95)의 실행 과정을 수행합니다.

## 4. 라이센스
MIT License에 따라 배포됩니다. 자세한 내용은 `LICENSE`를 확인하세요.<br>