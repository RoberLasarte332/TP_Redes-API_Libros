#!/usr/bin/env python3
"""
Simple CLI client that uses `requests` to interact with the FastAPI Books API.

Usage examples:
  python requests_client.py list --base http://127.0.0.1:8000
  python requests_client.py get 2 --base http://127.0.0.1:8000
  python requests_client.py add --title "Libro" --author "Autor" --base http://127.0.0.1:8000 --user admin --pass password
  python requests_client.py delete 3 --base http://127.0.0.1:8000 --user admin --pass password
  python requests_client.py stats --base http://127.0.0.1:8000
  python requests_client.py authors --base http://127.0.0.1:8000
"""
import argparse
import json
import sys
from getpass import getpass
import requests
from requests.auth import HTTPBasicAuth


def pretty_print(resp):
    try:
        data = resp.json()
        print(json.dumps(data, indent=2, ensure_ascii=False))
    except ValueError:
        print(resp.text)


def parse_args():
    parser = argparse.ArgumentParser(description="Requests-based client for the Books API")
    sub = parser.add_subparsers(dest="cmd", required=True)

    # list
    list_p = sub.add_parser('list', help='List books (supports filters)')
    list_p.add_argument('--title', help='Filter by title')
    list_p.add_argument('--author', help='Filter by author')
    list_p.add_argument('--language', help='Filter by language')
    list_p.add_argument('--country', help='Filter by country')
    list_p.add_argument('--pages-min', type=int, help='Minimum pages')
    list_p.add_argument('--pages-max', type=int, help='Maximum pages')

    # get
    get_p = sub.add_parser('get', help='Get a book by index')
    get_p.add_argument('id', type=int, help='Book index')

    # add
    add_p = sub.add_parser('add', help='Add a book (Basic Auth)')
    add_p.add_argument('--title', required=True)
    add_p.add_argument('--author')
    add_p.add_argument('--pages', type=int)
    add_p.add_argument('--country')
    add_p.add_argument('--language')
    add_p.add_argument('--year', type=int)
    add_p.add_argument('--link')
    add_p.add_argument('--imageLink')

    # delete
    del_p = sub.add_parser('delete', help='Delete a book by index (Basic Auth)')
    del_p.add_argument('id', type=int)

    # other endpoints
    sub.add_parser('stats', help='Get library stats')
    sub.add_parser('authors', help='List authors')
    sub.add_parser('languages', help='List languages')
    sub.add_parser('countries', help='List countries')

    # global args
    parser.add_argument('--base', default='http://127.0.0.1:8000', help='Base URL of the API')
    parser.add_argument('--user', help='Username for Basic Auth')
    parser.add_argument('--pass', dest='password', help='Password for Basic Auth')
    return parser.parse_args()


def run():
    args = parse_args()
    base = args.base.rstrip('/')
    auth = None
    if getattr(args, 'user', None):
        password = args.password if args.password is not None else getpass('Password: ')
        auth = HTTPBasicAuth(args.user, password)

    try:
        if args.cmd == 'list':
            params = {}
            for k in ['title', 'author', 'language', 'country']:
                v = getattr(args, k, None)
                if v: params[k] = v
            if args.pages_min is not None: params['pages_min'] = args.pages_min
            if args.pages_max is not None: params['pages_max'] = args.pages_max
            resp = requests.get(base + '/books', params=params, auth=auth, timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

        elif args.cmd == 'get':
            resp = requests.get(f"{base}/books/{args.id}", auth=auth, timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

        elif args.cmd == 'add':
            payload = {k: getattr(args, k) for k in ['title', 'author', 'pages', 'country', 'language', 'year', 'link', 'imageLink']}
            # remove None values
            payload = {k: v for k, v in payload.items() if v is not None}
            resp = requests.post(base + '/books', json=payload, auth=auth, timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

        elif args.cmd == 'delete':
            if not auth:
                print('DELETE requires Basic Auth (--user).')
                sys.exit(1)
            resp = requests.delete(f"{base}/books/{args.id}", auth=auth, timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

        elif args.cmd == 'stats':
            resp = requests.get(base + '/books/stats', timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

        elif args.cmd == 'authors':
            resp = requests.get(base + '/books/authors', timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

        elif args.cmd == 'languages':
            resp = requests.get(base + '/books/languages', timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

        elif args.cmd == 'countries':
            resp = requests.get(base + '/books/countries', timeout=5)
            resp.raise_for_status()
            pretty_print(resp)

    except requests.exceptions.ConnectionError:
        print('Could not connect to API. Is the server running and reachable?')
        sys.exit(1)
    except requests.exceptions.HTTPError as e:
        status = e.response.status_code if e.response else 'N/A'
        print(f'HTTP error: {status} - {e}')
        try:
            pretty_print(e.response)
        except Exception:
            pass
        sys.exit(1)
    except Exception as exc:
        print('Error: ', exc)
        sys.exit(1)


if __name__ == '__main__':
    run()
