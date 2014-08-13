<h1>LDAP Authentication</h1>
<hr />

<form>
	<div class="alert alert-info">
		<p>
			Register a new <strong>LDAP</strong>
		</p>
		<br />
		<input type="text" data-field="social:ldap:server" title="LDAP server" class="form-control input-lg" placeholder="ldap://some.server.url.com:9999r"><br />
		<input type="text" data-field="social:ldap:username" title="Username" class="form-control" placeholder="username"><br />
		<input type="password" data-field="social:ldap:password" title="Password" class="form-control" placeholder="password"><br />
		<input type="text" data-field="social:ldap:base" title="Base" class="form-control" placeholder="'dc=ad','dc=sm','dc=else'"><br />
		<input type="text" data-field="social:ldap:search" title="Search" class="form-control" placeholder="(sAMAccountName=$uid$)"><br />
	</div>
</form>

<button class="btn btn-lg btn-primary" id="save">Save</button>

<script>
	require(['forum/admin/settings'], function(Settings) {
		Settings.prepare();
	});
</script>
