import { tokens } from '../styles/tokens'

// One source for the volcano-status → color rule that was previously
// copy-pasted into Map, CompareBar, CompareModal and CountryPanel.
export function statusColor(status = '') {
  if (status.includes('Active'))  return tokens.color.status.active
  if (status.includes('Dormant')) return tokens.color.status.dormant
  return tokens.color.status.extinct
}
