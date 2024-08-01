package main

import data.cost_tags
import data.config.ec2
import data.config.tags

allowed_instance_type_regex := ec2.allowedInstanceTypeRegEx
enable_tag_checks := tags.enabled
enable_ec2_checks := ec2.enabled

module_address[i] = address {
	changeset := input.resource_changes[i]
	address := changeset.address
}

tags_contain_minimum_set[i] = resources {
	changeset := input.resource_changes[i]
	tags := changeset.change.after.tags
	resources := [resource | resource := module_address[i]; not cost_tags.check_for_proper_keys(changeset.change.after.tags)]
}

restricted_instance_types[i] = resources {
	changeset := input.resource_changes[i]
	instance_type := changeset.change.after.instance_type
	resources := [resource | resource := module_address[i]; regex.match(allowed_instance_type_regex, changeset.change.after.instance_type)]
}

# deny if required cost allocation tags are missing
deny_tags[msg] {
	resources := tags_contain_minimum_set[_]
	resources != []
	msg := sprintf("Missing required cost allocation tags for the following resource: %v", [resources])
}

# deny resources with instances are created with large|metal instanceTypes
deny_instance_types[msg] {
	resources := restricted_instance_types[_]
	resources != []
	msg = sprintf("Found restricted instanceType usage in following resource: `%v`. Should not contain [large|metal] instances.", [resources])
}

exception[rules] {
	not enable_ec2_checks
	rules := ["instance_types"]
}

exception[rules] {
	not enable_tag_checks
	rules := ["tags"]
}