import sys
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))

from sync_applicants import classify_comment, choose_final_type, dedupe_comments_by_user


class SyncApplicantsTests(unittest.TestCase):
    def test_doramzi_soldier_wins_even_with_huchu_word(self):
        self.assertEqual(classify_comment('-병사 -후추 하겠습니다~!'), '병사')
        self.assertEqual(classify_comment('후추'), '미분류')

    def test_mixed_officer_and_soldier_remains_unclassified(self):
        self.assertEqual(classify_comment('간부 OR 행정병'), '미분류')
        self.assertEqual(classify_comment('신청 분야: 간부 / 행정병'), '미분류')

    def test_clear_application_fields(self):
        self.assertEqual(classify_comment('신청분야 :간부'), '간부')
        self.assertEqual(classify_comment('병사 / 마병대 1회 경험 有'), '병사')
        self.assertEqual(classify_comment('간부 없이 훈병 지원합니다'), '병사')

    def test_existing_manual_final_type_has_priority(self):
        self.assertEqual(choose_final_type('병사', '미분류'), '미분류')
        self.assertEqual(choose_final_type('병사', ''), '병사')

    def test_duplicate_user_keeps_newest_comment(self):
        comments = [
            {'userId': 'same', 'commentNo': '100', 'regDate': '2026-09-09 12:00:00', 'comment': '병사'},
            {'userId': 'same', 'commentNo': '101', 'regDate': '2026-09-09 13:00:00', 'comment': '병사'},
            {'userId': 'other', 'commentNo': '102', 'regDate': '2026-09-09 11:00:00', 'comment': '간부'},
        ]
        result = dedupe_comments_by_user(comments)
        self.assertEqual([x['userId'] for x in result], ['same', 'other'])
        self.assertEqual(result[0]['commentNo'], '101')


if __name__ == '__main__':
    unittest.main()
