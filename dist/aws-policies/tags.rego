package cost_tags

import data.config.aws.tags

cost_allocation_tags = {type | type := tags.allowedBillingTags[_]}

check_for_proper_keys(tags) {
	keys := {key | tags[key]}
	leftover := cost_allocation_tags - keys
	leftover == set()
}
