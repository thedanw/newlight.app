# People Flows Fields Reference

Source: `https://www.elvanto.com/api/peopleFlows-fields/`

## Default Fields (returned by peopleFlows/getAll, peopleFlows/steps/getAll)

| Field | Type | Description |
|-------|------|-------------|
| id | string | The ID of the people flow. |
| name | string | The name of the people flow. |
| admins | array | Array of admin member IDs. |
| status | string | Status of the flow. |
| access | string | Access level. |
| steps | array | Array of step objects. |
| locations | array | Locations assigned. |
| demographics | array | Demographics assigned. |
| entry_point | string | Entry point. |
| description | string | Description. |
| instructions | string | Instructions. |
| notifications | array | Notification settings. |
| hide_pending | string | Whether to hide pending members. |
| step_due | - | Due date calculation (see below) |

## Step Due Date Calculation

The `step_due` field (returned by `peopleFlows/steps/getAll`) has a complex type-based calculation:

| Type | Behavior |
|------|----------|
| *(empty)* | Immediate (due now) |
| `days` | X days from when person enters step |
| `dayweek` | Specific day of the week |
| `monthday` | Uses week-of-month (`occurrence`: 1, 2, 3, 4, 5, last) + day of week |
| `monthdate` | Specific date next month |
| `quarterly` | Sunday of the quarter |
| `date` | Specific date with timezone |

## People Flow Step Member Fields

Returned by `peopleFlows/steps/people`:

| Field | Type | Description |
|-------|------|-------------|
| member_firstname | string | Member's first name |
| member_preferred_name | string | Preferred name |
| member_middle_name | string\|null | Middle name |
| member_lastname | string | Last name |
| date_added | datetime | When member was added to step |
| assigned_admin_id | string | Assigned admin UUID (empty if unassigned) |
| status | string | `pending`, `inprogress`, `complete`, `notstarted` |
| completed_date | datetime\|null | When step was completed |
| completed_member | string | Member who completed the step |
| due_date | date | Due date |
| flow_step_member_id | string | Flow step member UUID |
| id | string | Person UUID |