// CJK query normalization: strip common modifiers, extract core search term.

// Common CJK modifiers (sorted by length, longest first)
const CJK_SUFFIXES = [
  "导演剪辑版", "加长版", "无删减", "完整版", "剧场版",
  "第一季", "第二季", "第三季", "第四季", "第五季", "第六季",
  "第1季", "第2季", "第3季", "第4季", "第5季", "第6季",
  "字幕组", "双语", "国语", "粤语", "台配", "中字",
  "中文", "英文", "日语", "韩语", "字幕",
  "全集", "合集", "高清", "下载", "种子", "磁力",
];

// CJK numeral to Arabic
const CN_NUM = {
  "一": "1", "二": "2", "三": "3", "四": "4",
  "五": "5", "六": "6", "七": "7", "八": "8", "九": "9",
};

// CJK title to English title mapping
const TITLE_MAP = {
  "怪奇物语": "Stranger Things",
  "权力的游戏": "Game of Thrones",
  "绝命毒师": "Breaking Bad",
  "行尸走肉": "The Walking Dead",
  "黑镜": "Black Mirror",
  "西部世界": "Westworld",
  "纸牌屋": "House of Cards",
  "风骚律师": "Better Call Saul",
  "瑞克和莫蒂": "Rick and Morty",
  "老友记": "Friends",
  "生活大爆炸": "The Big Bang Theory",
  "切尔诺贝利": "Chernobyl",
  "曼达洛人": "The Mandalorian",
  "猎魔人": "The Witcher",
  "黑袍纠察队": "The Boys",
  "最后生还者": "The Last of Us",
  "继承之战": "Succession",
  "浴血黑帮": "Peaky Blinders",
  "王冠": "The Crown",
  "真探": "True Detective",
  "毒枭": "Narcos",
  "暗黑": "Dark",
  "双峰": "Twin Peaks",
  "使女的故事": "The Handmaid's Tale",
  "杀死伊芙": "Killing Eve",
  "傲骨贤妻": "The Good Wife",
  "无耻之徒": "Shameless",
  "硅谷": "Silicon Valley",
  "神探夏洛克": "Sherlock",
  "黑道家族": "The Sopranos",
  "火线": "The Wire",
  "广告狂人": "Mad Men",
  "绝命律师": "Better Call Saul",
  "三体": "Three Body",
  "流浪地球": "The Wandering Earth",
  "漫长的季节": "The Long Season",
  "繁花": "Blossoms Shanghai",
  "狂飙": "The Knockout",
  "开端": "Reset",
  "隐秘的角落": "The Bad Kids",
  "沉默的真相": "The Long Night",
  "白夜追凶": "Day and Night",
  "庆余年": "Joy of Life",
  "琅琊榜": "Nirvana in Fire",
  "伪装者": "The Disguiser",
  "甄嬛传": "Empresses in the Palace",
  "如懿传": "Ruyi's Royal Love in the Palace",
  "延禧攻略": "Story of Yanxi Palace",
  "长安十二时辰": "The Longest Day in Chang'an",
  "山海情": "Minning Town",
  "觉醒年代": "The Age of Awakening",
  "功勋": "Medal of the Republic",
  "大江大河": "Like a Flowing River",
  "都挺好": "All is Well",
  "三十而已": "Nothing But Thirty",
  "欢乐颂": "Ode to Joy",
  "扫黑风暴": "Crime Crackdown",
  "破冰行动": "The Thunder",
  "人民的名义": "In the Name of the People",
  "亮剑": "Drawing Sword",
  "大明王朝": "Ming Dynasty",
  // 动漫/漫画
  "宠物小精灵": "Pokemon",
  "宠物小精灵特别篇": "Pokemon Adventures",
  "神奇宝贝特别篇": "Pokemon Adventures",
  "宝可梦": "Pokemon",
  "神奇宝贝": "Pokemon",
  "海贼王": "One Piece",
  "火影忍者": "Naruto",
  "死神": "Bleach",
  "进击的巨人": "Attack on Titan",
  "鬼灭之刃": "Demon Slayer",
  "咒术回战": "Jujutsu Kaisen",
  "龙珠": "Dragon Ball",
  "名侦探柯南": "Detective Conan",
  "灌篮高手": "Slam Dunk",
  "新世纪福音战士": "Evangelion",
  "一拳超人": "One Punch Man",
  "刀剑神域": "Sword Art Online",
  "钢之炼金术师": "Fullmetal Alchemist",
  "犬夜叉": "Inuyasha",
  "银魂": "Gintama",
  "我的英雄学院": "My Hero Academia",
  "东京食尸鬼": "Tokyo Ghoul",
  "全职猎人": "Hunter x Hunter",
};

function isCJK(str) {
  let cjkCount = 0;
  for (const ch of str) {
    const code = ch.codePointAt(0);
    if (
      (code >= 0x4E00 && code <= 0x9FFF) ||
      (code >= 0x3400 && code <= 0x4DBF) ||
      (code >= 0x3040 && code <= 0x30FF) ||
      (code >= 0xAC00 && code <= 0xD7AF)
    ) {
      cjkCount++;
    }
  }
  return cjkCount > 0 && cjkCount / str.length >= 0.5;
}

// Extract season number from suffix (Chinese or Arabic numeral)
function extractSeasonNum(suffix) {
  if (!suffix) return "";
  if (suffix.length >= 2) {
    const cn = suffix[1];
    if (CN_NUM[cn]) return CN_NUM[cn];
  }
  const m = suffix.match(/(\d+)/);
  return m ? m[1] : "";
}

// Strip common modifiers, return core CJK search term
export function normalizeQuery(query) {
  if (!query || !isCJK(query)) return query;

  let result = query;
  let changed = true;

  while (changed && result.length > 2) {
    changed = false;
    for (const suffix of CJK_SUFFIXES) {
      if (result.endsWith(suffix) && result.length - suffix.length >= 2) {
        result = result.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
  }

  return result || query;
}

// Return English translation + season, or null if no mapping exists
export function getEnglishQuery(query) {
  if (!query || !isCJK(query)) return null;

  let result = query;
  let seasonNum = "";
  const seasonSuffixRe = /第[一二三四五六七八九\d]季$/;

  let changed = true;
  while (changed && result.length > 2) {
    changed = false;
    for (const suffix of CJK_SUFFIXES) {
      if (result.endsWith(suffix) && result.length - suffix.length >= 2) {
        if (seasonSuffixRe.test(suffix) && !seasonNum) {
          seasonNum = extractSeasonNum(suffix);
        }
        result = result.slice(0, -suffix.length);
        changed = true;
        break;
      }
    }
  }

  const core = result || query;
  const english = TITLE_MAP[core];
  if (!english) return null;

  const seasonStr = seasonNum ? " Season " + seasonNum : "";
  return english + seasonStr;
}
