function settingsComponent(props) {
  return (
    <Page>
      <Section
        title={<Text bold align="center">App Settings</Text>}>
      </Section>
      <Section>
        Configure the Authorization code:
        <TextInput settingsKey="auth" label="e.g., Basic cmBxc3NjeYjeIO==" type="text" />
        
        Configure up to five CALDAV URLs:
        <TextInput settingsKey="url0" label="URL 1: (e.g.: https://hostname:8443/calendars/__uids__/XXXXXXX-XXXX-XXXX-XXXX-XXXXXX/YYYYYY-YYYY-YYYY-YYYY-YYYYYY/)" type="text" />
        <TextInput settingsKey="url1" label="URL 2: (e.g.: https://hostname:8443/calendars/__uids__/XXXXXXX-XXXX-XXXX-XXXX-XXXXXX/YYYYYY-YYYY-YYYY-YYYY-YYYYYY/)" type="text" />
        <TextInput settingsKey="url2" label="URL 3: (e.g.: https://hostname:8443/calendars/__uids__/XXXXXXX-XXXX-XXXX-XXXX-XXXXXX/YYYYYY-YYYY-YYYY-YYYY-YYYYYY/)" type="text" />
        <TextInput settingsKey="url3" label="URL 4: (e.g.: https://hostname:8443/calendars/__uids__/XXXXXXX-XXXX-XXXX-XXXX-XXXXXX/YYYYYY-YYYY-YYYY-YYYY-YYYYYY/)" type="text" />
        <TextInput settingsKey="url4" label="URL 5: (e.g.: https://hostname:8443/calendars/__uids__/XXXXXXX-XXXX-XXXX-XXXX-XXXXXX/YYYYYY-YYYY-YYYY-YYYY-YYYYYY/)" type="text" />
        </Section>
    </Page>
  );
}

registerSettingsPage(settingsComponent);
