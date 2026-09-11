const test = require('node:test');
const assert = require('node:assert/strict');
const details = require('../applicant-details.js');

test('parses application fields from structured comment', () => {
  const parsed = details.parseApplicantComment('병사 신청합니다!\n참여한 마크서버> 그냥서버2, 연토피아2\n뽑혀야 하는 이유: 끝까지 열심히 하겠습니다.');
  assert.equal(parsed.minecraftExperience, '그냥서버2, 연토피아2');
  assert.equal(parsed.reason, '끝까지 열심히 하겠습니다.');
});

test('parses common alternate headings', () => {
  const parsed = details.parseApplicantComment('간부 /\n마크 서버 경험 : 레오펠, 다이아랜딩\n지원 이유 : 방송적으로 성장하고 싶습니다.');
  assert.equal(parsed.minecraftExperience, '레오펠, 다이아랜딩');
  assert.equal(parsed.reason, '방송적으로 성장하고 싶습니다.');
});

test('live heading variants keep experience and reason sections separate', () => {
  const tadka = details.parseApplicantComment('🫡필! 씅!\n🪖신청분야 : 병사🪖\n🎮마크서버경험 : 그냥서버, 왁업\n\n🫡뽑아야 하는 이유 :\n캐릭터성과 끈기가 있습니다.\n\n🫡각오 : 끝까지 하겠습니다.');
  assert.equal(tadka.minecraftExperience, '그냥서버, 왁업');
  assert.match(tadka.reason, /^캐릭터성과 끈기가 있습니다/);

  const habbang = details.parseApplicantComment('하빵 병사로 지원 하고 싶습니다!\n\n안녕하세요!\n\n마크 경력\n미미네팜, 그냥서버, 지수의꿈\n\n1. 하빵이를 뽑아야 하는 이유\n어떤 역할이든 몰입합니다.');
  assert.equal(habbang.minecraftExperience, '미미네팜, 그냥서버, 지수의꿈');
  assert.equal(habbang.reason, '어떤 역할이든 몰입합니다.');

  const nani = details.parseApplicantComment('신청 분야 : 병사\n\n마크 경험\n\n마카오톡\n\n포켓꾸\n\n뽑혀야하는 이유\n\n배우고 성장하고 싶습니다.');
  assert.match(nani.minecraftExperience, /^마카오톡/);
  assert.match(nani.minecraftExperience, /포켓꾸/);
  assert.equal(nani.reason, '배우고 성장하고 싶습니다.');
});

test('experience heading followed by one paragraph can fall through to an unlabeled reason paragraph', () => {
  const parsed = details.parseApplicantComment('신청분야 : 병사\n마크서버경험\n왁타버스송년회/포켓몬서버\n\n안녕하세요. 마병대에 참가해 성장하고 싶습니다!');
  assert.equal(parsed.minecraftExperience, '왁타버스송년회/포켓몬서버');
  assert.equal(parsed.reason, '안녕하세요. 마병대에 참가해 성장하고 싶습니다!');
});

test('slash after a field heading is treated as a field separator, not experience content', () => {
  const parsed = details.parseApplicantComment('신청분야/ 병사\n마크서버경험/ 지수의 꿈, 다이아랜딩, 그냥서버\n\n안녕하세요. 마병대를 정말 좋아해서 꼭 참여하고 싶습니다.');
  assert.equal(parsed.minecraftExperience, '지수의 꿈, 다이아랜딩, 그냥서버');
  assert.equal(parsed.reason, '안녕하세요. 마병대를 정말 좋아해서 꼭 참여하고 싶습니다.');
});

test('counts applicants with any verified season history once', () => {
  const items = [{userId:'a'}, {userId:'b'}, {userId:'c'}];
  const count = details.countExperiencedApplicants(items, item => item.userId === 'a' ? [1,2] : item.userId === 'b' ? [] : [3]);
  assert.equal(count, 2);
});

test('normalizes attachment urls from api item', () => {
  assert.deepEqual(details.getApplicantPhotoUrls({ photoUrls:['https://x.test/a.jpg','https://x.test/a.jpg','bad'] }), ['https://x.test/a.jpg']);
});

test('Harry keeps inline slash experience separate from unlabeled reason', () => {
  const comment = `간부 / 마병대 1,2,3 올 참가

저의 인생을 바꾸어 준 마병대 컨텐츠!!
지금까지 올 참가 해왔습니다.
마지막 마병대가 4일지는 모르겠지만
그 끝에 꼭 함께 하고 싶습니다.
저에게는 너무 소중한 컨텐츠 이기 때문입니다.

간부로 신청을 합니다!
지난번에 간부를 경험했을 때
다음에 하게 된다면 더 잘 할 수 있을 것 같다
라는 생각과 아쉬움이 많았기 때문입니다.

올 참여했던 만큼 마병대 컨텐츠를 제일 잘 알고

병사 경험을 했었기에 병사들의 마음을 가장 공감할 수 있고

간부 경험을 통해 처음 간부를 하는 간부들에게 도움을 줄 수 있다는
자신감이 있기 때문입니다!

만약 다시 한번 간부를 할 수 있다면
지난번처럼 우승만을 노리는 소대가 아닌
우승과 웃음 둘 다 노리는 소대의 간부가 되고 싶습니다!!

병을 지원하는 분들에게 저와 같은
다신 없을 기억과 방송의 전환점을 남겨주는
그런 마병대4의 간부가 되고 싶습니다.`;
  const parsed = details.parseApplicantComment(comment);
  assert.equal(parsed.minecraftExperience, '마병대 1,2,3 올 참가');
  assert.match(parsed.reason, /^저의 인생을 바꾸어 준 마병대 컨텐츠!!/);
  assert.match(parsed.reason, /그런 마병대4의 간부가 되고 싶습니다\.$/);
});

test('Yuyeonseo keeps short Mabyeongdae server entries in experience before unlabeled reason', () => {
  const comment = `신청 분야 : 프리패스

마크 서버 경험 ▼

⚔️로나 2 [만개]

🌿마카오톡 1 [감체스터]

🌿랜드마꾸 [고유건설]

⚔️마카오톡 1.5 [쪼커]

⚔️마카오톡 1.75 [꼬습노]

⚔️코창서버 [아수라]

🌿마병대2 [중대장 전속부관]

⚔️오함마2 [유유울따]

🌿퍼켓몬서버 [바스코프]

🌿린코레일 [꽝나니파]

⚔️전쟁중 [썩었수당]

🌿레오펠 [한남더헬]

⚔️두아온 [썩썩두두]

⚔️연습서버 [버컴퍼니]

🌿마병대3 [중대장 전속부관]

🌿해초마을2 [한량]

🌿밍친서버:더다이노 [툰드라 부족 간부 비서]

🌿돌발서버 [단츄왕국, 레고건설]

🌿돌(발)비(서)서버 [섭주]

⚔️충동서버 [버컴퍼니]

⚔️삼국지서버 [촉나라]

🌿해켓몬 [버컴퍼니]

힐링서버 12개 / RPG 서버 10개

이번 마병대에서 제가 잘 할 수 있는 점이 있을거 같습니다 크지 않은 도움이라도 마병대가 물 흐르듯이 잘 흐를 수 있게 도움이 되고 싶습니다
프리패스로 기회 주셔서 감사합니다`;
  const parsed = details.parseApplicantComment(comment);
  assert.match(parsed.minecraftExperience, /^⚔️로나 2 \[만개\]/);
  assert.match(parsed.minecraftExperience, /🌿마병대2 \[중대장 전속부관\]/);
  assert.match(parsed.minecraftExperience, /🌿마병대3 \[중대장 전속부관\]/);
  assert.match(parsed.minecraftExperience, /힐링서버 12개 \/ RPG 서버 10개$/);
  assert.equal(parsed.reason, '이번 마병대에서 제가 잘 할 수 있는 점이 있을거 같습니다 크지 않은 도움이라도 마병대가 물 흐르듯이 잘 흐를 수 있게 도움이 되고 싶습니다\n프리패스로 기회 주셔서 감사합니다');
});

test('bare 이유 heading separates reason from minecraft experience', () => {
  const parsed = details.parseApplicantComment(`신청분야 : 간부
마크서버 경험 : 로나1&2,코창서버,악놀, 연습서버,충동서버,삼국지서버, 해켓몬
이유 : 첫 마병대인데 꼭 하고싶습니다 그리고 저에게 발데르데 카드가 있씁니다 꼭 기억해주십시오`);
  assert.equal(parsed.minecraftExperience, '로나1&2,코창서버,악놀, 연습서버,충동서버,삼국지서버, 해켓몬');
  assert.equal(parsed.reason, '첫 마병대인데 꼭 하고싶습니다 그리고 저에게 발데르데 카드가 있씁니다 꼭 기억해주십시오');
});

test('recognizes 마크서버 경력 heading', () => {
  const parsed = details.parseApplicantComment(`신청분야 : 병
마크서버 경력 : 마령전, 연습서버, 마병대3, 돌발서버, 뚱국지
뽑혀야 하는 이유 : 방송적으로 더 성장하고 싶습니다.`);
  assert.equal(parsed.minecraftExperience, '마령전, 연습서버, 마병대3, 돌발서버, 뚱국지');
  assert.equal(parsed.reason, '방송적으로 더 성장하고 싶습니다.');
});

test('recognizes 참여 마크 목록 heading', () => {
  const parsed = details.parseApplicantComment(`지원 분야 : 병사
참여 마크 목록 : 쌀레나, 능력자 대전, 앨더랜드, 그냥서버
뽑혀야 하는 이유 : 끝까지 해내겠습니다.`);
  assert.equal(parsed.minecraftExperience, '쌀레나, 능력자 대전, 앨더랜드, 그냥서버');
  assert.equal(parsed.reason, '끝까지 해내겠습니다.');
});

test('recognizes common typo 뽑여야 하는 이유', () => {
  const parsed = details.parseApplicantComment(`신청 분야 : 병
마크 서버 경험 : 마카오톡1.5, 다이아랜딩
뽑여야 하는 이유 : 마병대에서 성장하고 싶습니다.`);
  assert.equal(parsed.minecraftExperience, '마카오톡1.5, 다이아랜딩');
  assert.equal(parsed.reason, '마병대에서 성장하고 싶습니다.');
});

test('recognizes 신청 계기 as a reason boundary', () => {
  const parsed = details.parseApplicantComment(`신청분야 : 병사
마크서버경험 : 그냥서버1, 지수의꿈, 옹삼골
신청 계기 : 데뷔 전부터 마병대를 보고 꼭 참여하고 싶었습니다.`);
  assert.equal(parsed.minecraftExperience, '그냥서버1, 지수의꿈, 옹삼골');
  assert.equal(parsed.reason, '데뷔 전부터 마병대를 보고 꼭 참여하고 싶었습니다.');
});
