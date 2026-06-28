import type { ThemeConfig } from 'antd';

// 落地页提取的配色
export const colors = {
  indigo: '#4F46E5',
  indigoSoft: '#818CF8',
  indigoDeep: '#3730A3',
  paper: '#FAFAF7',
  paperDeep: '#F0EFE8',
  ink: '#1F1F2E',
  inkSoft: '#52525B',
  inkFaint: '#A1A1AA',
  warm: '#F59E0B',
  warmDeep: '#D97706',
  line: '#E4E4E7',
  danger: '#DC2626',
};

// 情绪等级颜色：1-3 冷静蓝，4-6 焦虑黄，7-10 冲动红
export function getEmotionColor(score: number): string {
  if (score <= 3) return colors.indigo;
  if (score <= 6) return colors.warm;
  return colors.danger;
}

// Ant Design 6 主题配置
export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: colors.indigo,
    colorLink: colors.indigo,
    colorBgBase: colors.paper,
    colorBgContainer: '#FFFFFF',
    colorBgLayout: colors.paper,
    colorTextBase: colors.ink,
    colorText: colors.ink,
    colorTextSecondary: colors.inkSoft,
    colorTextTertiary: colors.inkFaint,
    colorBorder: colors.line,
    colorBorderSecondary: colors.paperDeep,
    borderRadius: 10,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
  },
  components: {
    Layout: {
      headerBg: '#FFFFFF',
      headerHeight: 56,
      bodyBg: colors.paper,
    },
    Card: {
      borderRadiusLG: 14,
    },
  },
};
