"""Elvanto API Python client with API key/OAuth 2.0 auth and auto-pagination."""

import requests
from typing import Optional, Dict, List

BASE_URL = "https://api.elvanto.com/v1"
OAUTH_AUTH_URL = "https://www.elvanto.com/oauth/authorize"
OAUTH_TOKEN_URL = "https://www.elvanto.com/oauth/token"
DEFAULT_PAGE_SIZE = 1000


class ElvantoError(Exception):
    def __init__(self, code: int, message: str, response: Optional[Dict] = None):
        self.code = code
        self.message = message
        self.response = response
        super().__init__(f"Elvanto API Error {code}: {message}")


class ElvantoClient:
    """Initialize with api_key=, or (client_id, client_secret, refresh_token)."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        client_id: Optional[str] = None,
        client_secret: Optional[str] = None,
        refresh_token: Optional[str] = None,
        access_token: Optional[str] = None,
    ):
        self.api_key = api_key
        self.client_id = client_id
        self.client_secret = client_secret
        self._refresh_token = refresh_token
        self._access_token = access_token
        self.session = requests.Session()

        if not api_key and not (client_id and client_secret and refresh_token):
            raise ValueError("Provide either `api_key` or (`client_id`, `client_secret`, `refresh_token`)")

        if not api_key:
            self._refresh_access_token()

    def _refresh_access_token(self) -> None:
        data = {
            "grant_type": "refresh_token",
            "refresh_token": self._refresh_token,
            "client_id": self.client_id,
            "client_secret": self.client_secret,
        }
        resp = self.session.post(OAUTH_TOKEN_URL, data=data)
        resp.raise_for_status()
        token_data = resp.json()
        self._access_token = token_data["access_token"]
        if "refresh_token" in token_data:
            self._refresh_token = token_data["refresh_token"]

    @property
    def auth_token(self) -> str:
        if self.api_key:
            return self.api_key
        if not self._access_token:
            self._refresh_access_token()
        return self._access_token

    def _request(self, endpoint: str, data: Optional[Dict] = None,
                 fmt: str = "json", auto_paginate: bool = True) -> Dict:
        url = f"{BASE_URL}/{endpoint}.{fmt}"
        params = data or {}
        params.setdefault("page", 1)
        params.setdefault("page_size", DEFAULT_PAGE_SIZE)

        if self.api_key:
            params["auth"] = self.api_key
        else:
            self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})

        resp = self.session.post(
            url,
            json=params if fmt == "json" else None,
            data=params if fmt != "json" else None,
        )

        if resp.status_code != 200:
            try:
                error_data = resp.json()
                if error_data.get("status") == "fail":
                    error = error_data.get("error", {})
                    raise ElvantoError(
                        code=int(error.get("code", resp.status_code)),
                        message=error.get("message", "Unknown error"),
                        response=error_data,
                    )
            except (ValueError, KeyError):
                pass
            resp.raise_for_status()

        result = resp.json()
        if result.get("status") == "fail":
            error = result.get("error", {})
            raise ElvantoError(
                code=int(error.get("code", 0)),
                message=error.get("message", "Unknown error"),
                response=result,
            )

        if not auto_paginate:
            return result

        return self._auto_paginate(endpoint, params, result, fmt)

    def _auto_paginate(self, endpoint: str, params: Dict, first_page: Dict, fmt: str = "json") -> Dict:
        resource_key = self._guess_top_key(endpoint, first_page)
        if not resource_key or resource_key not in first_page:
            return first_page

        container = first_page[resource_key]
        if not isinstance(container, dict):
            return first_page

        items_key = self._guess_items_key(container)
        if not items_key:
            return first_page

        merged = dict(first_page)
        merged[resource_key] = dict(container)
        items = list(container.get(items_key, []))

        total = container.get("total", 0)
        per_page = container.get("per_page", DEFAULT_PAGE_SIZE)
        total_pages = max(1, (total + per_page - 1) // per_page) if total else 1

        for page_num in range(2, total_pages + 1):
            next_params = dict(params)
            next_params["page"] = page_num
            if self.api_key:
                next_params["auth"] = self.api_key
            else:
                self.session.headers.update({"Authorization": f"Bearer {self.auth_token}"})

            url = f"{BASE_URL}/{endpoint}.{fmt}"
            resp = self.session.post(
                url,
                json=next_params if fmt == "json" else None,
                data=next_params if fmt != "json" else None,
            )
            resp.raise_for_status()
            page_data = resp.json().get(resource_key, {})
            page_items = page_data.get(items_key, [])
            items.extend(page_items)

        merged[resource_key][items_key] = items
        return merged

    @staticmethod
    def _guess_top_key(endpoint: str, result: Dict) -> str:
        mappings = {
            "people/getAll": "people", "people/search": "people",
            "people/categories/getAll": "categories",
            "people/customFields/getAll": "custom_fields",
            "peopleFlows/getAll": "people_flows",
            "peopleFlows/steps/getAll": "people_flow_steps",
            "groups/getAll": "groups", "services/getAll": "services",
            "songs/getAll": "songs",
            "songs/arrangements/getAll": "arrangements",
            "songs/keys/getAll": "keys",
            "calendar/getAll": "calendars",
            "calendar/events/getAll": "events",
            "financial/transactions/getAll": "transactions",
            "financial/categories/getAll": "categories",
        }
        return mappings.get(endpoint, endpoint.split("/")[0])

    @staticmethod
    def _guess_items_key(container: Dict) -> Optional[str]:
        for key in ("person", "category", "categories", "custom_field",
                     "people_flow", "people_flow_step", "group", "service",
                     "song", "arrangement", "key", "calendar", "event", "transaction"):
            if key in container and isinstance(container[key], list):
                return key
        for key, val in container.items():
            if isinstance(val, list) and key != "on_this_page":
                return key
        return None

    # Resource accessors
    @property
    def people(self):
        return _PeopleResource(self)
    @property
    def people_flows(self):
        return _PeopleFlowsResource(self)
    @property
    def groups(self):
        return _GroupsResource(self)
    @property
    def services(self):
        return _ServicesResource(self)
    @property
    def songs(self):
        return _SongsResource(self)
    @property
    def calendar(self):
        return _CalendarResource(self)
    @property
    def financial(self):
        return _FinancialResource(self)


class _ResourceBase:
    def __init__(self, client: "ElvantoClient"):
        self.client = client

    def _get(self, endpoint: str, data: Optional[Dict] = None, auto_paginate: bool = True) -> Dict:
        return self.client._request(endpoint, data, auto_paginate=auto_paginate)


class _PeopleResource(_ResourceBase):
    def get_all(self, **kw): return self._get("people/getAll", kw)
    def search(self, search: Dict, **kw): return self._get("people/search", {"search": search, **kw})
    def search_by_date_modified(self, date_modified: str, fields: Optional[List[str]] = None, page_size: int = 1000):
        """Incremental sync: fetch all people modified on or after date_modified (UTC).
        
        Args:
            date_modified: UTC date as 'YYYY-MM-DD' or 'YYYY-MM-DD HH:MM:SS'.
                           Searches date_modified >= value.
            fields: Optional list of fields to return.
            page_size: Records per page (max 1000).
        """
        search_params = {"date_modified": date_modified}
        kw = {"page_size": page_size}
        if fields:
            kw["fields"] = fields
        return self._get("people/search", {"search": search_params, **kw})
    def get_info(self, person_id: str, **kw): return self._get("people/getInfo", {"id": person_id, **kw})
    def create(self, firstname: str, lastname: str, **kw): return self._get("people/create", {"firstname": firstname, "lastname": lastname, **kw}, auto_paginate=False)
    def edit(self, person_id: str, **kw): return self._get("people/edit", {"id": person_id, **kw}, auto_paginate=False)
    def remove(self, person_id: str): return self._get("people/remove", {"id": person_id}, auto_paginate=False)
    def current_user(self): return self._get("people/currentUser", {}, auto_paginate=False)
    def get_all_categories(self, **kw): return self._get("people/categories/getAll", kw)
    def get_all_custom_fields(self, **kw): return self._get("people/customFields/getAll", kw)


class _PeopleFlowsResource(_ResourceBase):
    def get_all(self, **kw): return self._get("peopleFlows/getAll", kw)
    def get_all_steps(self, flow_id: str, **kw): return self._get("peopleFlows/steps/getAll", {"flow_id": flow_id, **kw})
    def get_step_people(self, step_id: str, **kw): return self._get("peopleFlows/steps/people", {"step_id": step_id, **kw}, auto_paginate=False)
    def add_person(self, step_id: str, person_id: str, assign_to: Optional[str] = None):
        kw = {"assign_to": assign_to} if assign_to else {}
        return self._get("peopleFlows/steps/addPerson", {"step_id": step_id, "person_id": person_id, **kw}, auto_paginate=False)


class _GroupsResource(_ResourceBase):
    def get_all(self, **kw): return self._get("groups/getAll", kw)
    def get_info(self, group_id: str): return self._get("groups/getInfo", {"id": group_id}, auto_paginate=False)
    def create(self, name: str, **kw): return self._get("groups/create", {"name": name, **kw}, auto_paginate=False)
    def edit(self, group_id: str, **kw): return self._get("groups/edit", {"id": group_id, **kw}, auto_paginate=False)
    def remove(self, group_id: str): return self._get("groups/remove", {"id": group_id}, auto_paginate=False)
    def add_person(self, group_id: str, person_id: str, position: Optional[str] = None):
        kw = {"position": position} if position else {}
        return self._get("groups/addPerson", {"id": group_id, "person_id": person_id, **kw}, auto_paginate=False)
    def remove_person(self, group_id: str, person_id: str): return self._get("groups/removePerson", {"id": group_id, "person_id": person_id}, auto_paginate=False)


class _ServicesResource(_ResourceBase):
    def get_all(self, **kw): return self._get("services/getAll", kw)
    def get_info(self, service_id: str, fields: Optional[List[str]] = None):
        kw = {"fields": fields} if fields else {}
        return self._get("services/getInfo", {"id": service_id, **kw}, auto_paginate=False)
    def get_all_plan_templates(self, **kw): return self._get("services/planTemplates/getAll", kw)


class _SongsResource(_ResourceBase):
    def get_all(self, **kw): return self._get("songs/getAll", kw)
    def get_info(self, song_id: str, files: bool = False): return self._get("songs/getInfo", {"id": song_id, "files": files}, auto_paginate=False)
    def create(self, title: str, arrangements: List[Dict], **kw): return self._get("songs/create", {"title": title, "arrangements": arrangements, **kw}, auto_paginate=False)
    def edit(self, song_id: str, **kw): return self._get("songs/edit", {"id": song_id, **kw}, auto_paginate=False)
    def remove(self, song_id: str): return self._get("songs/remove", {"id": song_id}, auto_paginate=False)
    def get_all_categories(self, **kw): return self._get("songs/categories/getAll", kw)


class _CalendarResource(_ResourceBase):
    def get_all(self): return self._get("calendar/getAll", {}, auto_paginate=False)
    def get_all_events(self, start: str, end: str, **kw): return self._get("calendar/events/getAll", {"start": start, "end": end, **kw})
    def create_event(self, name: str, calendar_id: str, start: str, end: str, organizer: str, **kw):
        return self._get("calendar/events/create", {"name": name, "calendar_id": calendar_id, "start": start, "end": end, "organizer": organizer, **kw}, auto_paginate=False)
    def edit_event(self, event_id: str, **kw): return self._get("calendar/events/edit", {"id": event_id, **kw}, auto_paginate=False)
    def remove_event(self, event_id: str): return self._get("calendar/events/remove", {"id": event_id}, auto_paginate=False)


class _FinancialResource(_ResourceBase):
    def get_all_transactions(self, start: str, end: str, **kw): return self._get("financial/transactions/getAll", {"start": start, "end": end, **kw})
    def get_transaction(self, txn_id: str): return self._get("financial/transactions/getInfo", {"id": txn_id}, auto_paginate=False)
    def create_transaction(self, person: Dict, transaction_date: str, amounts: List[Dict], **kw):
        return self._get("financial/transactions/create", {"person": person, "transaction_date": transaction_date, "amounts": amounts, **kw}, auto_paginate=False)
    def edit_transaction(self, txn_id: str, **kw): return self._get("financial/transactions/edit", {"id": txn_id, **kw}, auto_paginate=False)
    def remove_transaction(self, txn_id: str): return self._get("financial/transactions/remove", {"id": txn_id}, auto_paginate=False)
    def get_all_categories(self, **kw): return self._get("financial/categories/getAll", kw)
    def create_category(self, name: str, tax_deductible: str = "n", status: int = 1): return self._get("financial/categories/create", {"name": name, "tax_deductible": tax_deductible, "status": status}, auto_paginate=False)


if __name__ == "__main__":
    import sys
    sys.exit("Import ElvantoClient from a script instead.")
