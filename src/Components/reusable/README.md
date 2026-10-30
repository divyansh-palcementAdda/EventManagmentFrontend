# Reusable Components

All components are now proper React components with props for flexible usage.

## Import

```javascript
import { Button, Input, Dropdown, Searchbar, Table, Toggle } from './Components/reusable';
```

## Usage Examples

### Button
```javascript
<Button variant="success" onClick={() => console.log('clicked')}>
  Success
</Button>

<Button variant="primary" disabled>
  Primary
</Button>
```

### Input
```javascript
<Input
  label="First name"
  id="first_name"
  placeholder="John"
  value={value}
  onChange={(e) => setValue(e.target.value)}
  required
/>
```

### Dropdown
```javascript
<Dropdown
  trigger="Select Option"
  options={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Settings', onClick: () => console.log('settings') }
  ]}
  onChange={(option) => console.log(option)}
/>
```

### Searchbar
```javascript
<Searchbar
  placeholder="Search events..."
  value={searchValue}
  onChange={(e) => setSearchValue(e.target.value)}
  onSubmit={() => console.log('search submitted')}
/>
```

### Table
```javascript
<Table
  columns={[
    { header: 'Name', accessor: 'name' },
    { header: 'Email', accessor: 'email' },
    { header: 'Action', accessor: 'id', render: (id) => <a href={`/edit/${id}`}>Edit</a> }
  ]}
  data={[
    { name: 'John', email: 'john@example.com', id: 1 },
    { name: 'Jane', email: 'jane@example.com', id: 2 }
  ]}
  onRowClick={(row) => console.log(row)}
/>
```

### Toggle
```javascript
<Toggle
  label="Toggle me"
  checked={isEnabled}
  onChange={(e) => setIsEnabled(e.target.checked)}
/>
```
