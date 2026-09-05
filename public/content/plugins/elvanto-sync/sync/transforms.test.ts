import { describe, it, expect } from 'vitest'
import {
  category_to_journey_stage,
  location_to_journey_tracks,
  defacto_to_partner,
  school_grade_to_kindy_year,
  kindy_year_to_school_grade,
  admin_to_access_permission,
  access_permission_to_admin,
  bool_to_yes_no,
  yes_no_to_bool,
  int_flag_to_bool,
  bool_to_int_flag,
  capitalize_enum,
  lowercase_enum,
  trim_suffix,
  parse_departments,
  format_departments,
  getTransform,
  listTransforms,
} from './transforms'

describe('Transform Functions', () => {
  describe('category_to_journey_stage', () => {
    it('maps Sunday Guest to guest', () => {
      expect(category_to_journey_stage('Sunday Guest')).toBe('guest')
    })
    
    it('maps Sunday Linked to linked', () => {
      expect(category_to_journey_stage('Sunday Linked')).toBe('linked')
    })
    
    it('maps Sunday Regular to regular', () => {
      expect(category_to_journey_stage('Sunday Regular')).toBe('regular')
    })
    
    it('maps Community Connection to contact', () => {
      expect(category_to_journey_stage('Community Connection')).toBe('contact')
    })
    
    it('handles trailing * and _', () => {
      expect(category_to_journey_stage('Sunday Regular_')).toBe('regular')
      expect(category_to_journey_stage('Community Connection*')).toBe('contact')
    })
    
    it('handles case insensitivity', () => {
      expect(category_to_journey_stage('sunday guest')).toBe('guest')
      expect(category_to_journey_stage('SUNDAY LINKED')).toBe('linked')
    })
    
    it('defaults to contact for unknown categories', () => {
      expect(category_to_journey_stage('Unknown Category')).toBe('contact')
      expect(category_to_journey_stage('')).toBe('contact')
    })
  })

  describe('location_to_journey_tracks', () => {
    it('returns empty object for null/undefined', () => {
      expect(location_to_journey_tracks(null)).toEqual({})
      expect(location_to_journey_tracks(undefined)).toEqual({})
    })
    
    it('returns empty object for empty locations', () => {
      expect(location_to_journey_tracks({ location: [] })).toEqual({})
    })
    
    it('maps locations to journey track keys', () => {
      const locations = {
        location: [
          { id: 'loc-1', name: 'Central Campus' },
          { id: 'loc-2', name: 'North Campus' },
        ]
      }
      const result = location_to_journey_tracks(locations)
      expect(result).toEqual({
        'location:loc-1': 'contact',
        'location:loc-2': 'contact',
      })
    })
  })

  describe('defacto_to_partner', () => {
    it('pull: Defacto → partner', () => {
      expect(defacto_to_partner('Defacto', { direction: 'pull' })).toBe('partner')
      expect(defacto_to_partner('defacto', { direction: 'pull' })).toBe('partner')
    })
    
    it('pull: other values pass through lowercased', () => {
      expect(defacto_to_partner('Married', { direction: 'pull' })).toBe('married')
      expect(defacto_to_partner('Single', { direction: 'pull' })).toBe('single')
    })
    
    it('push: Partner → Defacto', () => {
      expect(defacto_to_partner('Partner', { direction: 'push' })).toBe('Defacto')
      expect(defacto_to_partner('partner', { direction: 'push' })).toBe('Defacto')
    })
    
    it('push: other values capitalized', () => {
      expect(defacto_to_partner('Married', { direction: 'push' })).toBe('Married')
      expect(defacto_to_partner('single', { direction: 'push' })).toBe('Single')
    })
  })

  describe('school_grade_to_kindy_year', () => {
    it('parses Kindy', () => {
      expect(school_grade_to_kindy_year('Kindy')).toBe(0)
      expect(school_grade_to_kindy_year('kindergarten')).toBe(0)
      expect(school_grade_to_kindy_year('KINDY')).toBe(0)
    })
    
    it('parses Year N', () => {
      expect(school_grade_to_kindy_year('Year 1')).toBe(1)
      expect(school_grade_to_kindy_year('year 5')).toBe(5)
      expect(school_grade_to_kindy_year('Year 12')).toBe(12)
    })
    
    it('parses bare numbers', () => {
      expect(school_grade_to_kindy_year('1')).toBe(1)
      expect(school_grade_to_kindy_year('12')).toBe(12)
    })
    
    it('returns null for invalid', () => {
      expect(school_grade_to_kindy_year('')).toBeNull()
      expect(school_grade_to_kindy_year('Invalid')).toBeNull()
      expect(school_grade_to_kindy_year('Year 13')).toBeNull()
    })
  })

  describe('kindy_year_to_school_grade', () => {
    it('converts 0 to Kindy', () => {
      expect(kindy_year_to_school_grade(0)).toBe('Kindy')
    })
    
    it('converts 1-12 to Year N', () => {
      expect(kindy_year_to_school_grade(1)).toBe('Year 1')
      expect(kindy_year_to_school_grade(5)).toBe('Year 5')
      expect(kindy_year_to_school_grade(12)).toBe('Year 12')
    })
    
    it('returns null for invalid', () => {
      expect(kindy_year_to_school_grade(null)).toBeNull()
      expect(kindy_year_to_school_grade(-1)).toBeNull()
      expect(kindy_year_to_school_grade(13)).toBeNull()
    })
    
    it('respects demographic filter', () => {
      expect(kindy_year_to_school_grade(5, { demographic: 'adult' })).toBeNull()
      expect(kindy_year_to_school_grade(5, { demographic: 'youth' })).toBe('Year 5')
      expect(kindy_year_to_school_grade(5, { demographic: 'child' })).toBe('Year 5')
    })
  })

  describe('admin_to_access_permission', () => {
    it('promotes to admin when admin flag is 1', () => {
      expect(admin_to_access_permission(1)).toBe('admin')
      expect(admin_to_access_permission('1')).toBe('admin')
      expect(admin_to_access_permission(true)).toBe('admin')
    })
    
    it('promote-only: does not downgrade existing higher permission', () => {
      expect(admin_to_access_permission(1, { currentPermission: 'super_admin' })).toBe('super_admin')
      expect(admin_to_access_permission(1, { currentPermission: 'admin' })).toBe('admin')
    })
    
    it('non-admin: returns member_area or keeps higher', () => {
      expect(admin_to_access_permission(0)).toBe('member_area')
      expect(admin_to_access_permission(0, { currentPermission: 'team_leaders' })).toBe('team_leaders')
      expect(admin_to_access_permission(0, { currentPermission: 'admin' })).toBe('admin')
    })
  })

  describe('access_permission_to_admin', () => {
    it('returns 1 for admin and super_admin', () => {
      expect(access_permission_to_admin('admin')).toBe(1)
      expect(access_permission_to_admin('super_admin')).toBe(1)
    })
    
    it('returns 0 for other permissions', () => {
      expect(access_permission_to_admin('public')).toBe(0)
      expect(access_permission_to_admin('member_area')).toBe(0)
      expect(access_permission_to_admin('team_leaders')).toBe(0)
    })
  })

  describe('bool_to_yes_no / yes_no_to_bool', () => {
    it('bool_to_yes_no converts correctly', () => {
      expect(bool_to_yes_no(true)).toBe('yes')
      expect(bool_to_yes_no(false)).toBe('no')
      expect(bool_to_yes_no(1)).toBe('yes')
      expect(bool_to_yes_no(0)).toBe('no')
      expect(bool_to_yes_no('yes')).toBe('yes')
      expect(bool_to_yes_no('no')).toBe('no')
    })
    
    it('yes_no_to_bool converts correctly', () => {
      expect(yes_no_to_bool('yes')).toBe(true)
      expect(yes_no_to_bool('no')).toBe(false)
      expect(yes_no_to_bool('y')).toBe(true)
      expect(yes_no_to_bool('n')).toBe(false)
      expect(yes_no_to_bool(true)).toBe(true)
      expect(yes_no_to_bool(false)).toBe(false)
    })
  })

  describe('int_flag_to_bool / bool_to_int_flag', () => {
    it('int_flag_to_bool converts correctly', () => {
      expect(int_flag_to_bool(1)).toBe(true)
      expect(int_flag_to_bool(0)).toBe(false)
      expect(int_flag_to_bool('1')).toBe(true)
      expect(int_flag_to_bool('0')).toBe(false)
      expect(int_flag_to_bool(true)).toBe(true)
      expect(int_flag_to_bool(false)).toBe(false)
    })
    
    it('bool_to_int_flag converts correctly', () => {
      expect(bool_to_int_flag(true)).toBe(1)
      expect(bool_to_int_flag(false)).toBe(0)
      expect(bool_to_int_flag('yes')).toBe(1)
      expect(bool_to_int_flag('no')).toBe(0)
    })
  })

  describe('capitalize_enum / lowercase_enum', () => {
    it('capitalize_enum capitalizes first letter', () => {
      expect(capitalize_enum('active')).toBe('Active')
      expect(capitalize_enum('PRIMARY CONTACT')).toBe('Primary contact')
    })
    
    it('lowercase_enum lowercases', () => {
      expect(lowercase_enum('Active')).toBe('active')
      expect(lowercase_enum('PRIMARY CONTACT')).toBe('primary contact')
    })
  })

  describe('trim_suffix', () => {
    it('removes trailing * and _', () => {
      expect(trim_suffix('Community Connection*')).toBe('Community Connection')
      expect(trim_suffix('Sunday Regular_')).toBe('Sunday Regular')
      expect(trim_suffix('Test*_')).toBe('Test')
    })
    
    it('handles no suffix', () => {
      expect(trim_suffix('Normal Name')).toBe('Normal Name')
    })
  })

  describe('parse_departments / format_departments', () => {
    it('parses department string', () => {
      const result = parse_departments('Worship||Vocals||Leader, Kids||Teachers||Assistant')
      expect(result).toEqual([
        { department: 'Worship', subDepartment: 'Vocals', position: 'Leader' },
        { department: 'Kids', subDepartment: 'Teachers', position: 'Assistant' },
      ])
    })
    
    it('formats departments back to string', () => {
      const departments = [
        { department: 'Worship', subDepartment: 'Vocals', position: 'Leader' },
        { department: 'Kids', subDepartment: 'Teachers', position: 'Assistant' },
      ]
      expect(format_departments(departments)).toBe('Worship||Vocals||Leader,Kids||Teachers||Assistant')
    })
    
    it('handles empty', () => {
      expect(parse_departments('')).toEqual([])
      expect(format_departments([])).toBe('')
    })
  })

  describe('Transform Registry', () => {
    it('getTransform returns correct function', () => {
      expect(getTransform('category_to_journey_stage')).toBe(category_to_journey_stage)
      expect(getTransform('unknown')).toBeUndefined()
    })
    
    it('listTransforms returns all transform names', () => {
      const transforms = listTransforms()
      expect(transforms).toContain('category_to_journey_stage')
      expect(transforms).toContain('defacto_to_partner')
      expect(transforms.length).toBeGreaterThan(10)
    })
  })
})